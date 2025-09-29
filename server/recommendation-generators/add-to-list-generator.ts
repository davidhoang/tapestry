import { db } from "@db";
import { designers, lists, listDesigners } from "@db/schema";
import { eq, and, notInArray, desc, sql } from "drizzle-orm";
import { 
  RecommendationGenerator, 
  GeneratorContext 
} from "../recommendation-engine";
import { 
  RecommendationResult, 
  RecommendationCandidate
} from "../recommendation-utils";

/**
 * Add to List Generator
 * 
 * Finds designers that would be good fits for existing lists
 * based on skills, experience level, and list criteria.
 */
export class AddToListGenerator implements RecommendationGenerator {
  
  getType(): string {
    return 'add_to_list';
  }

  async isEnabled(context: GeneratorContext): Promise<boolean> {
    // Check if workspace has lists that could benefit from new additions
    const listsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(lists)
      .where(eq(lists.workspaceId, context.workspaceId));

    return listsCount[0]?.count > 0;
  }

  async generate(context: GeneratorContext): Promise<RecommendationResult[]> {
    const recommendations: RecommendationResult[] = [];

    // Get all lists in the workspace
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

    // Generate recommendations for each list
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
    // Skip if list already has many designers (>20)
    if (list.designers.length > 20) {
      return [];
    }

    // Get existing designer IDs in the list
    const existingDesignerIds = list.designers.map((ld: any) => ld.designerId);

    // Analyze existing designers to understand list criteria
    const listCriteria = await this.analyzeListCriteria(list, context);

    // Find potential candidates
    const candidates = await this.findCandidates(
      list, 
      existingDesignerIds, 
      listCriteria, 
      context
    );

    if (candidates.length === 0) {
      return []; // No suitable candidates
    }

    // Create recommendation
    const recommendation: RecommendationResult = {
      id: 0, // Will be set when persisted
      type: 'add_to_list',
      title: `Add designers to "${list.name}"`,
      description: `Found ${candidates.length} designers who would be great additions to this list`,
      score: this.calculateListRecommendationScore(list, candidates, listCriteria),
      priority: this.calculatePriority(list, candidates),
      candidates: candidates.slice(0, 10), // Top 10 candidates
      reasoning: [
        `Found ${candidates.length} designers matching the list criteria`,
        `Top candidate has ${candidates[0]?.score || 0}% compatibility`,
        `Average skill match across candidates: ${Math.round(candidates.reduce((sum, c) => sum + c.score, 0) / candidates.length)}%`
      ],
      metadata: {
        listId: list.id,
        listName: list.name,
        existingCount: list.designers.length,
        candidateCount: candidates.length,
        ...listCriteria,
        actionUrl: `/lists/${list.id}`,
        estimatedValue: this.estimateValue(candidates.length),
      },
      groupKey: `add_to_list_${list.id}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    return [recommendation];
  }

  private async analyzeListCriteria(list: any, context: GeneratorContext) {
    const designers = list.designers.map((ld: any) => ld.designer);

    if (designers.length === 0) {
      return {
        commonSkills: [],
        averageLevel: null,
        commonLocation: null,
        preferredAvailability: false,
      };
    }

    // Analyze skills
    const allSkills = designers
      .flatMap((d: any) => d.skills || [])
      .filter(Boolean);

    const skillCounts = new Map<string, number>();
    for (const skill of allSkills) {
      skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
    }

    // Get skills that appear in at least 30% of designers
    const threshold = Math.max(1, Math.ceil(designers.length * 0.3));
    const commonSkills = Array.from(skillCounts.entries())
      .filter(([_, count]) => count >= threshold)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill]) => skill);

    // Analyze levels
    const levels = designers.map((d: any) => d.level).filter(Boolean);
    const levelCounts = new Map<string, number>();
    for (const level of levels) {
      levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
    }
    const averageLevel = levelCounts.size > 0 
      ? Array.from(levelCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
      : undefined;

    // Analyze locations
    const locations = designers.map((d: any) => d.location).filter(Boolean);
    const locationCounts = new Map<string, number>();
    for (const location of locations) {
      locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
    }
    const commonLocation = locationCounts.size > 0 
      ? Array.from(locationCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
      : undefined;

    // Analyze availability preference
    const availableCount = designers.filter((d: any) => d.available).length;
    const preferredAvailability = availableCount > designers.length * 0.6;

    return {
      commonSkills,
      averageLevel,
      commonLocation,
      preferredAvailability,
    };
  }

  private async findCandidates(
    list: any,
    existingDesignerIds: number[],
    criteria: any,
    context: GeneratorContext
  ): Promise<RecommendationCandidate[]> {
    // Build query conditions
    const whereConditions = [eq(designers.workspaceId, context.workspaceId)];

    // Exclude existing designers
    if (existingDesignerIds.length > 0) {
      whereConditions.push(notInArray(designers.id, existingDesignerIds));
    }

    // Get all potential candidates
    const potentialCandidates = await db.query.designers.findMany({
      where: and(...whereConditions),
      orderBy: desc(designers.createdAt),
    });

    // Score and rank candidates
    const scoredCandidates: RecommendationCandidate[] = [];

    for (const designer of potentialCandidates) {
      const score = context.utils.scoreDesigner(designer, {
        requiredSkills: criteria.commonSkills,
        preferredLevel: criteria.averageLevel,
        locationPreference: criteria.commonLocation,
        availabilityRequired: criteria.preferredAvailability,
      });

      // Only include candidates with reasonable scores
      if (score >= 40) {
        const reasoning = this.generateCandidateReasoning(designer, criteria, score);

        scoredCandidates.push({
          designerId: designer.id,
          score,
          rank: 0, // Will be set after sorting
          reasoning,
          metadata: {
            skillMatches: this.getSkillMatches(designer.skills, criteria.commonSkills),
            experienceMatch: this.calculateExperienceMatch(designer.level, criteria.averageLevel),
            locationMatch: this.calculateLocationMatch(designer.location || '', criteria.commonLocation || ''),
            availabilityMatch: designer.available === criteria.preferredAvailability,
            portfolioRelevance: 0, // Could be enhanced with portfolio analysis
            confidence: this.calculateConfidence(score),
          },
        });
      }
    }

    // Sort by score and assign ranks
    scoredCandidates.sort((a, b) => b.score - a.score);
    scoredCandidates.forEach((candidate, index) => {
      candidate.rank = index + 1;
    });

    return scoredCandidates.slice(0, 20); // Top 20 candidates
  }

  private generateCandidateReasoning(designer: any, criteria: any, score: number): string {
    const reasons: string[] = [];

    // Skill matches
    const skillMatches = this.getSkillMatches(designer.skills || [], criteria.commonSkills);
    if (skillMatches.length > 0) {
      reasons.push(`Matches ${skillMatches.length} key skills: ${skillMatches.slice(0, 3).join(', ')}`);
    }

    // Level match
    if (designer.level === criteria.averageLevel) {
      reasons.push(`Experience level (${designer.level}) aligns with list average`);
    }

    // Location match
    if (designer.location && criteria.commonLocation && designer.location === criteria.commonLocation) {
      reasons.push(`Located in preferred area: ${designer.location}`);
    }

    // Availability
    if (designer.available && criteria.preferredAvailability) {
      reasons.push('Currently available for work');
    }

    // Profile quality - simplified calculation
    const hasPhoto = !!designer.photoUrl;
    const hasDescription = !!designer.description;
    const hasWebsite = !!designer.website;
    const profileQuality = hasPhoto && hasDescription && hasWebsite;
    
    if (profileQuality) {
      reasons.push('Comprehensive profile with photo, description, and portfolio');
    }

    // Default reasoning if no specific matches
    if (reasons.length === 0) {
      reasons.push(`Good overall compatibility (${score}% match)`);
    }

    return reasons.slice(0, 3).join('. ') + '.';
  }

  private getSkillMatches(designerSkills: string[], requiredSkills: string[]): string[] {
    if (!designerSkills || !requiredSkills) return [];

    // Handle case where skills might not be arrays
    const skillsArray = Array.isArray(designerSkills) ? designerSkills : [];
    const reqSkillsArray = Array.isArray(requiredSkills) ? requiredSkills : [];

    if (skillsArray.length === 0 || reqSkillsArray.length === 0) return [];

    const normalizedDesignerSkills = skillsArray.map(s => String(s).toLowerCase());
    const normalizedRequiredSkills = reqSkillsArray.map(s => String(s).toLowerCase());

    return requiredSkills.filter(skill =>
      normalizedDesignerSkills.includes(skill.toLowerCase())
    );
  }

  private calculateExperienceMatch(designerLevel: string, preferredLevel: string): number {
    if (!designerLevel || !preferredLevel) return 50;

    const levels = ['intern', 'junior', 'mid', 'senior', 'lead', 'principal'];
    const designerIndex = levels.indexOf(designerLevel.toLowerCase());
    const preferredIndex = levels.indexOf(preferredLevel.toLowerCase());

    if (designerIndex === -1 || preferredIndex === -1) return 50;
    if (designerIndex === preferredIndex) return 100;

    const distance = Math.abs(designerIndex - preferredIndex);
    return Math.max(0, 100 - (distance * 25));
  }

  private calculateLocationMatch(designerLocation: string, preferredLocation: string): boolean {
    if (!designerLocation || !preferredLocation) return false;
    return designerLocation.toLowerCase() === preferredLocation.toLowerCase();
  }

  private calculateConfidence(score: number): number {
    // Higher scores get higher confidence
    if (score >= 80) return 90;
    if (score >= 70) return 80;
    if (score >= 60) return 70;
    if (score >= 50) return 60;
    return 50;
  }

  private calculateListRecommendationScore(list: any, candidates: RecommendationCandidate[], criteria: any): number {
    if (candidates.length === 0) return 0;

    let score = 0;

    // Base score from top candidates
    const topCandidatesScore = candidates.slice(0, 5).reduce((sum, c) => sum + c.score, 0) / Math.min(5, candidates.length);
    score += topCandidatesScore * 0.6;

    // Bonus for quantity of good candidates
    const goodCandidates = candidates.filter(c => c.score >= 70).length;
    score += Math.min(20, goodCandidates * 2);

    // Bonus for list activity (recently created or updated lists are prioritized)
    const daysSinceCreation = (Date.now() - new Date(list.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 7) {
      score += 10; // New list bonus
    }

    // Penalty for lists that already have many designers
    if (list.designers.length > 10) {
      score -= 5;
    }

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  private calculatePriority(list: any, candidates: RecommendationCandidate[]): string {
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

  private estimateValue(candidateCount: number): string {
    if (candidateCount >= 10) return 'High potential - many strong candidates';
    if (candidateCount >= 5) return 'Medium potential - several good candidates';
    if (candidateCount >= 2) return 'Low potential - few candidates';
    return 'Minimal potential - very few candidates';
  }
}