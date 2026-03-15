import OpenAI from "openai";
import { db } from "@db";
import { designers, lists, designerOutreach } from "@db/schema";
import { eq, and, notInArray, desc, sql } from "drizzle-orm";
import { 
  RecommendationGenerator, 
  GeneratorContext 
} from "../recommendation-engine";
import { 
  RecommendationResult, 
  RecommendationCandidate
} from "../recommendation-utils";

const MAX_CANDIDATES = 5;
const AVAILABILITY_BOOST = 15;

interface AICriteria {
  skills: { name: string; weight: number }[];
  seniority: string | null;
  specialization: string | null;
  availabilityPreference: boolean;
}

export class AddToListGenerator implements RecommendationGenerator {
  
  getType(): string {
    return 'add_to_list';
  }

  async isEnabled(context: GeneratorContext): Promise<boolean> {
    const listsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(lists)
      .where(eq(lists.workspaceId, context.workspaceId));

    return listsCount[0]?.count > 0;
  }

  async generate(context: GeneratorContext): Promise<RecommendationResult[]> {
    const recommendations: RecommendationResult[] = [];

    const workspaceLists = await db.query.lists.findMany({
      where: eq(lists.workspaceId, context.workspaceId),
      with: {
        designers: {
          with: {
            designer: true,
          },
        },
      },
      orderBy: desc(lists.createdAt),
    });

    for (const list of workspaceLists) {
      try {
        const listRecommendations = await this.generateForList(list, context);
        recommendations.push(...listRecommendations);
      } catch (error) {
        console.error(`Error generating recommendations for list ${list.id}:`, error);
      }
    }

    return recommendations;
  }

  private async generateForList(
    list: any, 
    context: GeneratorContext
  ): Promise<RecommendationResult[]> {
    if (list.designers.length > 20) {
      return [];
    }

    const existingDesignerIds = list.designers.map((ld: any) => ld.designerId);

    const aiCriteria = await this.interpretListWithAI(list);

    const candidates = await this.findCandidates(
      list, 
      existingDesignerIds, 
      aiCriteria, 
      context
    );

    if (candidates.length === 0) {
      return [];
    }

    const recommendation: RecommendationResult = {
      id: 0,
      type: 'add_to_list',
      title: `Add designers to "${list.name}"`,
      description: `Found ${candidates.length} designer${candidates.length === 1 ? '' : 's'} who would be great additions to this list`,
      score: this.calculateListRecommendationScore(list, candidates),
      priority: this.calculatePriority(candidates),
      candidates,
      reasoning: [
        `Found ${candidates.length} designers matching the list intent`,
        `Top candidate has ${candidates[0]?.score || 0}% compatibility`,
        `Average match across candidates: ${Math.round(candidates.reduce((sum, c) => sum + c.score, 0) / candidates.length)}%`
      ],
      metadata: {
        listId: list.id,
        listName: list.name,
        existingCount: list.designers.length,
        candidateCount: candidates.length,
        aiCriteria,
        actionUrl: `/lists/${list.id}`,
      },
      groupKey: `add_to_list_${list.id}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    return [recommendation];
  }

  private async interpretListWithAI(list: any): Promise<AICriteria> {
    const existingDesignerSummary = list.designers
      .map((ld: any) => ld.designer)
      .filter(Boolean)
      .slice(0, 5)
      .map((d: any) => `${d.name} (${d.title || 'N/A'}, ${d.level || 'N/A'}, skills: ${(d.skills || []).slice(0, 5).join(', ')})`)
      .join('\n');

    const prompt = `Analyze this talent list and determine what kind of designers belong in it.

List Name: "${list.name}"
Description: ${list.description || 'No description provided'}
${existingDesignerSummary ? `\nCurrent members (sample):\n${existingDesignerSummary}` : ''}

Based on the list name, description, and any existing members, determine the ideal candidate criteria.

Respond in JSON format:
{
  "skills": [{"name": "skill name", "weight": 1-10}],
  "seniority": "intern|junior|mid|senior|lead|principal" or null,
  "specialization": "brief specialization description" or null,
  "availabilityPreference": true/false
}`;

    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a recruiting assistant that interprets talent list intent. Analyze list names and descriptions to determine the ideal candidate profile. Be specific about skills and seniority. Return valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const result = JSON.parse(content);

      return {
        skills: Array.isArray(result.skills) ? result.skills.slice(0, 10) : [],
        seniority: result.seniority || null,
        specialization: result.specialization || null,
        availabilityPreference: result.availabilityPreference === true,
      };
    } catch (error) {
      console.error('AI list interpretation failed, falling back to mechanical analysis:', error);
      return this.fallbackCriteria(list);
    }
  }

  private fallbackCriteria(list: any): AICriteria {
    const existingDesigners = list.designers.map((ld: any) => ld.designer).filter(Boolean);

    if (existingDesigners.length === 0) {
      return {
        skills: [],
        seniority: null,
        specialization: null,
        availabilityPreference: false,
      };
    }

    const allSkills = existingDesigners.flatMap((d: any) => d.skills || []).filter(Boolean);
    const skillCounts = new Map<string, number>();
    for (const skill of allSkills) {
      skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
    }
    const threshold = Math.max(1, Math.ceil(existingDesigners.length * 0.3));
    const skills = Array.from(skillCounts.entries())
      .filter(([_, count]) => count >= threshold)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, weight: Math.min(10, Math.round((count / existingDesigners.length) * 10)) }));

    const levels = existingDesigners.map((d: any) => d.level).filter(Boolean);
    const levelCounts = new Map<string, number>();
    for (const level of levels) {
      levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
    }
    const seniority = levelCounts.size > 0
      ? Array.from(levelCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
      : null;

    const availableCount = existingDesigners.filter((d: any) => d.available).length;
    const availabilityPreference = availableCount > existingDesigners.length * 0.6;

    return { skills, seniority, specialization: null, availabilityPreference };
  }

  private async findCandidates(
    list: any,
    existingDesignerIds: number[],
    criteria: AICriteria,
    context: GeneratorContext
  ): Promise<RecommendationCandidate[]> {
    const whereConditions = [eq(designers.workspaceId, context.workspaceId)];

    if (existingDesignerIds.length > 0) {
      whereConditions.push(notInArray(designers.id, existingDesignerIds));
    }

    const potentialCandidates = await db.query.designers.findMany({
      where: and(...whereConditions),
      orderBy: desc(designers.createdAt),
    });

    const outreachRecords = await db.query.designerOutreach.findMany({
      where: eq(designerOutreach.workspaceId, context.workspaceId),
      orderBy: desc(designerOutreach.createdAt),
    });

    const lastOutreachByDesigner = new Map<number, Date>();
    for (const record of outreachRecords) {
      const existing = lastOutreachByDesigner.get(record.designerId);
      if (!existing || new Date(record.createdAt) > existing) {
        lastOutreachByDesigner.set(record.designerId, new Date(record.createdAt));
      }
    }

    const scoredCandidates: RecommendationCandidate[] = [];

    for (const designer of potentialCandidates) {
      let score = this.scoreDesignerWithAICriteria(designer, criteria, context);

      if (designer.available) {
        score += AVAILABILITY_BOOST;
      }

      const lastOutreach = lastOutreachByDesigner.get(designer.id);
      if (lastOutreach) {
        const daysSince = Math.floor((Date.now() - lastOutreach.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince < 30) {
          score += 10;
        } else if (daysSince < 90) {
          score += 5;
        }
      }

      if (score >= 40) {
        const reasoning = this.generateCandidateReasoning(designer, criteria, score);

        scoredCandidates.push({
          designerId: designer.id,
          score: Math.min(100, score),
          rank: 0,
          reasoning,
          metadata: {
            available: designer.available,
            lastContactDaysAgo: lastOutreach
              ? Math.floor((Date.now() - lastOutreach.getTime()) / (1000 * 60 * 60 * 24))
              : null,
          },
        });
      }
    }

    scoredCandidates.sort((a, b) => b.score - a.score);
    const topCandidates = scoredCandidates.slice(0, MAX_CANDIDATES);
    topCandidates.forEach((candidate, index) => {
      candidate.rank = index + 1;
    });

    return topCandidates;
  }

  private scoreDesignerWithAICriteria(
    designer: any,
    criteria: AICriteria,
    context: GeneratorContext
  ): number {
    let score = 0;
    const designerSkills = (designer.skills || []).map((s: string) => s.toLowerCase());

    if (criteria.skills.length > 0) {
      const totalWeight = criteria.skills.reduce((sum, s) => sum + s.weight, 0);
      let weightedMatches = 0;

      for (const skill of criteria.skills) {
        const skillLower = skill.name.toLowerCase();
        const exactMatch = designerSkills.includes(skillLower);
        const partialMatch = !exactMatch && designerSkills.some((ds: string) =>
          ds.includes(skillLower) || skillLower.includes(ds)
        );

        if (exactMatch) {
          weightedMatches += skill.weight;
        } else if (partialMatch) {
          weightedMatches += skill.weight * 0.6;
        }
      }

      score += totalWeight > 0 ? (weightedMatches / totalWeight) * 40 : 0;
    } else {
      score += Math.min(40, (designer.skills?.length || 0) * 5);
    }

    if (criteria.seniority && designer.level) {
      const levels = ['intern', 'junior', 'mid', 'senior', 'lead', 'principal'];
      const designerIdx = levels.indexOf(designer.level.toLowerCase());
      const targetIdx = levels.indexOf(criteria.seniority.toLowerCase());
      if (designerIdx !== -1 && targetIdx !== -1) {
        const distance = Math.abs(designerIdx - targetIdx);
        score += Math.max(0, 20 - distance * 5);
      } else {
        score += 10;
      }
    } else {
      score += 14;
    }

    if (criteria.specialization) {
      const specLower = criteria.specialization.toLowerCase();
      const titleLower = (designer.title || '').toLowerCase();
      const descLower = (designer.description || '').toLowerCase();
      const skillsJoined = designerSkills.join(' ');

      const specWords = specLower.split(/\s+/).filter((w: string) => w.length > 3);
      let specMatches = 0;
      for (const word of specWords) {
        if (titleLower.includes(word) || descLower.includes(word) || skillsJoined.includes(word)) {
          specMatches++;
        }
      }
      const specScore = specWords.length > 0 ? (specMatches / specWords.length) * 15 : 0;
      score += specScore;
    }

    if (criteria.availabilityPreference) {
      score += designer.available ? 15 : 0;
    } else {
      score += designer.available ? 5 : 3;
    }

    const completeness = context.utils.calculateProfileCompleteness(designer);
    score += (completeness / 100) * 10;

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  private generateCandidateReasoning(designer: any, criteria: AICriteria, score: number): string {
    const reasons: string[] = [];

    const designerSkills = (designer.skills || []).map((s: string) => s.toLowerCase());
    const matchedSkills = criteria.skills
      .filter(s => designerSkills.includes(s.name.toLowerCase()))
      .map(s => s.name);

    if (matchedSkills.length > 0) {
      reasons.push(`Matches key skills: ${matchedSkills.slice(0, 3).join(', ')}`);
    }

    if (criteria.seniority && designer.level && designer.level.toLowerCase() === criteria.seniority.toLowerCase()) {
      reasons.push(`Experience level (${designer.level}) aligns with list target`);
    }

    if (designer.available) {
      reasons.push('Currently available for work');
    }

    if (criteria.specialization) {
      const desc = (designer.description || '').toLowerCase();
      const title = (designer.title || '').toLowerCase();
      const spec = criteria.specialization.toLowerCase();
      if (desc.includes(spec) || title.includes(spec)) {
        reasons.push(`Specializes in ${criteria.specialization}`);
      }
    }

    if (reasons.length === 0) {
      reasons.push(`Good overall compatibility (${Math.min(100, score)}% match)`);
    }

    return reasons.slice(0, 3).join('. ') + '.';
  }

  private calculateListRecommendationScore(list: any, candidates: RecommendationCandidate[]): number {
    if (candidates.length === 0) return 0;

    let score = 0;

    const topCandidatesScore = candidates.slice(0, 5).reduce((sum, c) => sum + c.score, 0) / Math.min(5, candidates.length);
    score += topCandidatesScore * 0.6;

    const goodCandidates = candidates.filter(c => c.score >= 70).length;
    score += Math.min(20, goodCandidates * 4);

    const daysSinceCreation = (Date.now() - new Date(list.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 7) {
      score += 10;
    }

    if (list.designers.length > 10) {
      score -= 5;
    }

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  private calculatePriority(candidates: RecommendationCandidate[]): string {
    const topScore = candidates[0]?.score || 0;
    const goodCandidateCount = candidates.filter(c => c.score >= 70).length;

    if (topScore >= 85 && goodCandidateCount >= 3) {
      return 'high';
    }

    if (topScore >= 75 && goodCandidateCount >= 2) {
      return 'medium';
    }

    return 'low';
  }
}
