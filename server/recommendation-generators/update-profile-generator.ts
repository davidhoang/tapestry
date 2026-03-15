import { db } from "@db";
import { designers, lists, designerOutreach, jobs } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";
import { 
  RecommendationGenerator, 
  GeneratorContext 
} from "../recommendation-engine";
import { 
  RecommendationResult, 
  RecommendationCandidate
} from "../recommendation-utils";

interface ProfileField {
  field: string;
  name: string;
  impactWeight: number;
  impactDescription: string;
}

const PROFILE_FIELDS: ProfileField[] = [
  { field: 'photoUrl', name: 'profile photo', impactWeight: 10, impactDescription: 'Profiles with photos get 3x more views' },
  { field: 'description', name: 'description', impactWeight: 9, impactDescription: 'Descriptions help hirers understand expertise' },
  { field: 'website', name: 'portfolio link', impactWeight: 8, impactDescription: 'Portfolio links increase hire probability by 60%' },
  { field: 'location', name: 'location', impactWeight: 6, impactDescription: 'Location helps with local project matching' },
  { field: 'linkedIn', name: 'LinkedIn profile', impactWeight: 5, impactDescription: 'LinkedIn profiles build credibility' },
];

const COMMON_SKILLS = [
  'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator',
  'react', 'vue', 'angular', 'javascript', 'typescript',
  'html', 'css', 'sass', 'tailwind', 'ui', 'ux', 'design',
  'prototyping', 'wireframing', 'user research', 'product design',
  'motion design', 'animation', 'branding', 'graphic design',
  'interaction design', 'visual design', 'design systems',
];

export class UpdateProfileGenerator implements RecommendationGenerator {
  
  getType(): string {
    return 'update_profile';
  }

  async isEnabled(context: GeneratorContext): Promise<boolean> {
    return true;
  }

  async generate(context: GeneratorContext): Promise<RecommendationResult[]> {
    const allDesigners = await db.query.designers.findMany({
      where: eq(designers.workspaceId, context.workspaceId),
      orderBy: desc(designers.createdAt),
    });

    if (allDesigners.length === 0) {
      return [];
    }

    const workspaceLists = await db.query.lists.findMany({
      where: eq(lists.workspaceId, context.workspaceId),
      with: {
        designers: {
          with: {
            designer: true,
          },
        },
      },
    });

    const activeJobs = await db.query.jobs.findMany({
      where: and(
        eq(jobs.workspaceId, context.workspaceId),
        eq(jobs.status, 'active')
      ),
    });

    const outreachRecords = await db.query.designerOutreach.findMany({
      where: eq(designerOutreach.workspaceId, context.workspaceId),
      orderBy: desc(designerOutreach.createdAt),
    });

    const contactedDesignerIds = new Set<number>();
    for (const record of outreachRecords) {
      contactedDesignerIds.add(record.designerId);
    }

    const topCandidateIds = this.getTopCandidatesForListsAndRoles(allDesigners, workspaceLists, activeJobs, context);

    const recommendations: RecommendationResult[] = [];

    for (const designer of allDesigners) {
      const completeness = context.utils.calculateProfileCompleteness(designer);
      const missingFields = this.getMissingFields(designer);

      if (missingFields.length === 0) continue;

      const passesGate = this.passesRelevanceGate(
        designer,
        completeness,
        contactedDesignerIds,
        topCandidateIds
      );

      if (!passesGate) continue;

      const highestImpactField = missingFields.sort((a, b) => b.impactWeight - a.impactWeight)[0];

      const recommendation = this.createRecommendation(
        designer,
        highestImpactField,
        missingFields,
        completeness,
        topCandidateIds.has(designer.id),
        context
      );

      recommendations.push(recommendation);
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  private passesRelevanceGate(
    designer: any,
    completeness: number,
    contactedDesignerIds: Set<number>,
    topCandidateIds: Set<number>
  ): boolean {
    if (designer.available === true) {
      return true;
    }

    if (topCandidateIds.has(designer.id)) {
      return true;
    }

    if (!contactedDesignerIds.has(designer.id) && completeness >= 40 && completeness <= 70) {
      return true;
    }

    return false;
  }

  private getTopCandidatesForListsAndRoles(
    allDesigners: any[],
    workspaceLists: any[],
    activeJobs: any[],
    context: GeneratorContext
  ): Set<number> {
    const topIds = new Set<number>();

    for (const list of workspaceLists) {
      const existingIds = new Set(list.designers.map((ld: any) => ld.designerId));
      const existingDesigners = list.designers.map((ld: any) => ld.designer).filter(Boolean);

      if (existingDesigners.length === 0) continue;

      const allSkills = existingDesigners.flatMap((d: any) => d.skills || []).filter(Boolean);
      const skillCounts = new Map<string, number>();
      for (const skill of allSkills) {
        skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
      }
      const threshold = Math.max(1, Math.ceil(existingDesigners.length * 0.3));
      const commonSkills = Array.from(skillCounts.entries())
        .filter(([_, count]) => count >= threshold)
        .map(([skill]) => skill);

      const levels = existingDesigners.map((d: any) => d.level).filter(Boolean);
      const levelCounts = new Map<string, number>();
      for (const level of levels) {
        levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
      }
      const preferredLevel = levelCounts.size > 0
        ? Array.from(levelCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
        : undefined;

      const scored = allDesigners
        .filter(d => !existingIds.has(d.id))
        .map(d => ({
          id: d.id,
          score: context.utils.scoreDesigner(d, {
            requiredSkills: commonSkills,
            preferredLevel,
          }),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      for (const s of scored) {
        if (s.score >= 50) {
          topIds.add(s.id);
        }
      }
    }

    for (const job of activeJobs) {
      const requiredSkills = this.extractSkillsFromJobDescription(job.description);

      const scored = allDesigners
        .map(d => ({
          id: d.id,
          score: context.utils.scoreDesigner(d, {
            requiredSkills,
          }),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      for (const s of scored) {
        if (s.score >= 50) {
          topIds.add(s.id);
        }
      }
    }

    return topIds;
  }

  private extractSkillsFromJobDescription(description: string): string[] {
    const lowerDescription = description.toLowerCase();
    return COMMON_SKILLS.filter(skill => lowerDescription.includes(skill));
  }

  private getMissingFields(designer: any): ProfileField[] {
    return PROFILE_FIELDS.filter(field => {
      const value = designer[field.field];
      return !value || value.toString().trim().length === 0;
    });
  }

  private createRecommendation(
    designer: any,
    highestImpactField: ProfileField,
    allMissingFields: ProfileField[],
    completeness: number,
    isTopCandidate: boolean,
    context: GeneratorContext
  ): RecommendationResult {
    const otherMissingCount = allMissingFields.length - 1;
    const isOnlyMissing = otherMissingCount === 0;

    let description: string;
    if (isOnlyMissing) {
      description = `Add a ${highestImpactField.name} — this is the only missing field keeping them out of top matches`;
    } else {
      description = `Add a ${highestImpactField.name} to boost discoverability. ${highestImpactField.impactDescription}`;
    }

    let score = 0;
    score += highestImpactField.impactWeight * 5;

    if (designer.available) {
      score += 15;
    }

    if (isTopCandidate) {
      score += 10;
    }

    score += Math.max(0, 20 - (100 - completeness) / 5);

    score = Math.round(Math.max(0, Math.min(100, score)));

    let priority: string;
    if (designer.available && highestImpactField.impactWeight >= 8) {
      priority = 'high';
    } else if (isTopCandidate || designer.available) {
      priority = 'medium';
    } else {
      priority = 'low';
    }

    const candidate: RecommendationCandidate = {
      designerId: designer.id,
      score,
      rank: 1,
      reasoning: description,
      metadata: {
        missingField: highestImpactField.field,
        completeness,
        isTopCandidate,
        available: designer.available,
      },
    };

    return {
      id: 0,
      type: 'update_profile',
      title: `Update ${designer.name}'s profile`,
      description,
      score,
      priority,
      candidates: [candidate],
      reasoning: [
        `Profile completeness: ${completeness}%`,
        `Missing ${highestImpactField.name} — ${highestImpactField.impactDescription}`,
        designer.available ? 'Currently available — profile improvements are high-impact' : (isTopCandidate ? 'Top candidate for an active list or role' : 'Promising profile with room to improve'),
      ],
      metadata: {
        designerId: designer.id,
        designerName: designer.name,
        missingField: highestImpactField.field,
        missingFieldName: highestImpactField.name,
        totalMissingFields: allMissingFields.length,
        completeness,
        isTopCandidate,
        actionUrl: `/designers/${designer.id}/edit`,
      },
      groupKey: `update_profile_individual_${designer.id}`,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    };
  }
}
