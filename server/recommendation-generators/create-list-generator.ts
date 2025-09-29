import { db } from "@db";
import { designers, lists, listDesigners } from "@db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { 
  RecommendationGenerator, 
  GeneratorContext 
} from "../recommendation-engine";
import { 
  RecommendationResult, 
  RecommendationCandidate
} from "../recommendation-utils";

interface SkillCluster {
  skills: string[];
  designers: any[];
  commonLevel?: string;
  commonLocation?: string;
  avgCompleteness: number;
}

/**
 * Create List Generator
 * 
 * Analyzes designers to find common patterns and suggests new lists
 * that would group similar designers together effectively.
 */
export class CreateListGenerator implements RecommendationGenerator {
  
  getType(): string {
    return 'create_list';
  }

  async isEnabled(context: GeneratorContext): Promise<boolean> {
    // Check if workspace has enough designers to analyze for patterns
    const designerCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(designers)
      .where(eq(designers.workspaceId, context.workspaceId));

    return designerCount[0]?.count >= 5; // Need at least 5 designers to find patterns
  }

  async generate(context: GeneratorContext): Promise<RecommendationResult[]> {
    const recommendations: RecommendationResult[] = [];

    // Get all designers in the workspace
    const allDesigners = await db.query.designers.findMany({
      where: eq(designers.workspaceId, context.workspaceId),
      orderBy: desc(designers.createdAt),
    });

    if (allDesigners.length < 5) {
      return []; // Not enough data for pattern analysis
    }

    // Find existing lists to avoid duplicates
    const existingLists = await db.query.lists.findMany({
      where: eq(lists.workspaceId, context.workspaceId),
      with: {
        designers: {
          with: {
            designer: true,
          },
        },
      },
    });

    // Analyze patterns and generate recommendations
    const skillClusters = await this.analyzeSkillClusters(allDesigners, context);
    const levelGroups = await this.analyzeLevelGroups(allDesigners, context);
    const locationGroups = await this.analyzeLocationGroups(allDesigners, context);
    const availabilityGroups = await this.analyzeAvailabilityGroups(allDesigners, context);

    // Generate recommendations for skill-based lists
    for (const cluster of skillClusters) {
      const recommendation = await this.createSkillBasedRecommendation(
        cluster, 
        existingLists, 
        context
      );
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    // Generate recommendations for level-based lists
    for (const group of levelGroups) {
      const recommendation = await this.createLevelBasedRecommendation(
        group, 
        existingLists, 
        context
      );
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    // Generate recommendations for location-based lists
    for (const group of locationGroups) {
      const recommendation = await this.createLocationBasedRecommendation(
        group, 
        existingLists, 
        context
      );
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    // Generate recommendations for availability-based lists
    for (const group of availabilityGroups) {
      const recommendation = await this.createAvailabilityBasedRecommendation(
        group, 
        existingLists, 
        context
      );
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    return recommendations.slice(0, 10); // Limit to top 10 recommendations
  }

  private async analyzeSkillClusters(designers: any[], context: GeneratorContext): Promise<SkillCluster[]> {
    // Create skill frequency map
    const skillCounts = new Map<string, number>();
    const skillToDesigners = new Map<string, Set<number>>();

    for (const designer of designers) {
      const skills = designer.skills || [];
      for (const skill of skills) {
        if (skill && skill.trim()) {
          const normalizedSkill = skill.toLowerCase().trim();
          skillCounts.set(normalizedSkill, (skillCounts.get(normalizedSkill) || 0) + 1);
          
          if (!skillToDesigners.has(normalizedSkill)) {
            skillToDesigners.set(normalizedSkill, new Set());
          }
          skillToDesigners.get(normalizedSkill)!.add(designer.id);
        }
      }
    }

    // Find skills that appear in multiple designers (at least 3)
    const popularSkills = Array.from(skillCounts.entries())
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20); // Top 20 skills

    const clusters: SkillCluster[] = [];

    // Create clusters for individual popular skills
    for (const [skill, count] of popularSkills) {
      const designerIds = Array.from(skillToDesigners.get(skill) || []);
      const clusterDesigners = designers.filter(d => designerIds.includes(d.id));

      if (clusterDesigners.length >= 3) {
        clusters.push({
          skills: [skill],
          designers: clusterDesigners,
          avgCompleteness: this.calculateAverageCompleteness(clusterDesigners, context),
        });
      }
    }

    // Create clusters for skill combinations (e.g., "React + TypeScript")
    const skillCombinations = this.findSkillCombinations(designers, popularSkills.map(([skill]) => skill), context);
    for (const combination of skillCombinations) {
      if (combination.designers.length >= 3) {
        clusters.push(combination);
      }
    }

    return clusters.slice(0, 10); // Top 10 clusters
  }

  private findSkillCombinations(designers: any[], popularSkills: string[], context: GeneratorContext): SkillCluster[] {
    const combinations: SkillCluster[] = [];

    // Try combinations of 2-3 popular skills
    for (let i = 0; i < popularSkills.length; i++) {
      for (let j = i + 1; j < popularSkills.length; j++) {
        const skillPair = [popularSkills[i], popularSkills[j]];
        const matchingDesigners = designers.filter(designer => {
          const skills = designer.skills || [];
          const designerSkills = Array.isArray(skills) 
            ? skills.map((s: string) => s.toLowerCase().trim())
            : [];
          return skillPair.every(skill => designerSkills.includes(skill));
        });

        if (matchingDesigners.length >= 3) {
          combinations.push({
            skills: skillPair,
            designers: matchingDesigners,
            avgCompleteness: this.calculateAverageCompleteness(matchingDesigners, context),
          });
        }
      }
    }

    return combinations.sort((a, b) => b.designers.length - a.designers.length).slice(0, 5);
  }

  private async analyzeLevelGroups(designers: any[], context: GeneratorContext): Promise<any[]> {
    const levelGroups = new Map<string, any[]>();

    for (const designer of designers) {
      if (designer.level) {
        const level = designer.level.toLowerCase();
        if (!levelGroups.has(level)) {
          levelGroups.set(level, []);
        }
        levelGroups.get(level)!.push(designer);
      }
    }

    return Array.from(levelGroups.entries())
      .filter(([_, designers]) => designers.length >= 4) // At least 4 designers
      .map(([level, designers]) => ({
        level,
        designers,
        avgCompleteness: this.calculateAverageCompleteness(designers, context),
      }))
      .sort((a, b) => b.designers.length - a.designers.length);
  }

  private async analyzeLocationGroups(designers: any[], context: GeneratorContext): Promise<any[]> {
    const locationGroups = new Map<string, any[]>();

    for (const designer of designers) {
      if (designer.location) {
        const location = designer.location.toLowerCase().trim();
        if (!locationGroups.has(location)) {
          locationGroups.set(location, []);
        }
        locationGroups.get(location)!.push(designer);
      }
    }

    return Array.from(locationGroups.entries())
      .filter(([_, designers]) => designers.length >= 3) // At least 3 designers
      .map(([location, designers]) => ({
        location,
        designers,
        avgCompleteness: this.calculateAverageCompleteness(designers, context),
      }))
      .sort((a, b) => b.designers.length - a.designers.length);
  }

  private async analyzeAvailabilityGroups(designers: any[], context: GeneratorContext): Promise<any[]> {
    const availableDesigners = designers.filter(d => d.available);
    const unavailableDesigners = designers.filter(d => !d.available);

    const groups = [];

    if (availableDesigners.length >= 4) {
      groups.push({
        availability: true,
        designers: availableDesigners,
        avgCompleteness: this.calculateAverageCompleteness(availableDesigners, context),
      });
    }

    if (unavailableDesigners.length >= 4) {
      groups.push({
        availability: false,
        designers: unavailableDesigners,
        avgCompleteness: this.calculateAverageCompleteness(unavailableDesigners, context),
      });
    }

    return groups;
  }

  private calculateAverageCompleteness(designers: any[], context: GeneratorContext): number {
    if (designers.length === 0) return 0;
    
    const totalCompleteness = designers.reduce((sum, designer) => {
      return sum + context.utils.calculateProfileCompleteness(designer);
    }, 0);

    return Math.round(totalCompleteness / designers.length);
  }

  private async createSkillBasedRecommendation(
    cluster: SkillCluster,
    existingLists: any[],
    context: GeneratorContext
  ): Promise<RecommendationResult | null> {
    // Check if a similar list already exists
    const similarList = this.findSimilarSkillList(cluster.skills, existingLists);
    if (similarList) {
      return null; // Don't recommend if similar list exists
    }

    const listName = this.generateSkillBasedListName(cluster.skills);
    const score = this.calculateSkillClusterScore(cluster);

    if (score < 50) {
      return null; // Score too low
    }

    const candidates: RecommendationCandidate[] = cluster.designers.map((designer, index) => ({
      designerId: designer.id,
      score: context.utils.scoreDesigner(designer, { requiredSkills: cluster.skills }),
      rank: index + 1,
      reasoning: `Matches ${cluster.skills.length} key skills: ${cluster.skills.join(', ')}`,
      metadata: {
        skillMatches: cluster.skills,
        confidence: 85,
      },
    }));

    return {
      id: 0,
      type: 'create_list',
      title: `Create "${listName}" list`,
      description: `Group ${cluster.designers.length} designers with ${cluster.skills.join(' + ')} skills`,
      score,
      priority: this.calculateCreateListPriority(cluster.designers.length, score),
      candidates,
      reasoning: [
        `Found ${cluster.designers.length} designers with similar skills`,
        `Common skills: ${cluster.skills.join(', ')}`,
        `Average profile completeness: ${cluster.avgCompleteness}%`,
      ],
      metadata: {
        listType: 'skill-based',
        suggestedName: listName,
        commonSkills: cluster.skills,
        designerCount: cluster.designers.length,
        avgCompleteness: cluster.avgCompleteness,
        actionUrl: '/lists/new',
        estimatedValue: this.estimateListValue(cluster.designers.length, 'skill-based'),
      },
      groupKey: `create_list_skills_${cluster.skills.join('_').replace(/\s+/g, '_')}`,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    };
  }

  private async createLevelBasedRecommendation(
    group: any,
    existingLists: any[],
    context: GeneratorContext
  ): Promise<RecommendationResult | null> {
    const similarList = this.findSimilarLevelList(group.level, existingLists);
    if (similarList) {
      return null;
    }

    const listName = this.generateLevelBasedListName(group.level);
    const score = this.calculateLevelGroupScore(group);

    if (score < 45) {
      return null;
    }

    const candidates: RecommendationCandidate[] = group.designers.map((designer: any, index: number) => ({
      designerId: designer.id,
      score: context.utils.scoreDesigner(designer, { preferredLevel: group.level }),
      rank: index + 1,
      reasoning: `${group.level} level designer`,
      metadata: {
        experienceMatch: 100,
        confidence: 80,
      },
    }));

    return {
      id: 0,
      type: 'create_list',
      title: `Create "${listName}" list`,
      description: `Group ${group.designers.length} ${group.level} level designers`,
      score,
      priority: this.calculateCreateListPriority(group.designers.length, score),
      candidates,
      reasoning: [
        `Found ${group.designers.length} designers at ${group.level} level`,
        `Consistent experience level for easier matching`,
        `Average profile completeness: ${group.avgCompleteness}%`,
      ],
      metadata: {
        listType: 'level-based',
        suggestedName: listName,
        commonLevel: group.level,
        designerCount: group.designers.length,
        avgCompleteness: group.avgCompleteness,
        actionUrl: '/lists/new',
        estimatedValue: this.estimateListValue(group.designers.length, 'level-based'),
      },
      groupKey: `create_list_level_${group.level}`,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    };
  }

  private async createLocationBasedRecommendation(
    group: any,
    existingLists: any[],
    context: GeneratorContext
  ): Promise<RecommendationResult | null> {
    const similarList = this.findSimilarLocationList(group.location, existingLists);
    if (similarList) {
      return null;
    }

    const listName = this.generateLocationBasedListName(group.location);
    const score = this.calculateLocationGroupScore(group);

    if (score < 40) {
      return null;
    }

    const candidates: RecommendationCandidate[] = group.designers.map((designer: any, index: number) => ({
      designerId: designer.id,
      score: context.utils.scoreDesigner(designer, { locationPreference: group.location }),
      rank: index + 1,
      reasoning: `Located in ${group.location}`,
      metadata: {
        locationMatch: true,
        confidence: 75,
      },
    }));

    return {
      id: 0,
      type: 'create_list',
      title: `Create "${listName}" list`,
      description: `Group ${group.designers.length} designers from ${group.location}`,
      score,
      priority: this.calculateCreateListPriority(group.designers.length, score),
      candidates,
      reasoning: [
        `Found ${group.designers.length} designers in ${group.location}`,
        `Geographic consistency for local projects`,
        `Average profile completeness: ${group.avgCompleteness}%`,
      ],
      metadata: {
        listType: 'location-based',
        suggestedName: listName,
        commonLocation: group.location,
        designerCount: group.designers.length,
        avgCompleteness: group.avgCompleteness,
        actionUrl: '/lists/new',
        estimatedValue: this.estimateListValue(group.designers.length, 'location-based'),
      },
      groupKey: `create_list_location_${group.location.replace(/\s+/g, '_')}`,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    };
  }

  private async createAvailabilityBasedRecommendation(
    group: any,
    existingLists: any[],
    context: GeneratorContext
  ): Promise<RecommendationResult | null> {
    const similarList = this.findSimilarAvailabilityList(group.availability, existingLists);
    if (similarList) {
      return null;
    }

    const listName = group.availability ? 'Available Designers' : 'Unavailable Designers';
    const score = this.calculateAvailabilityGroupScore(group);

    if (score < 45) {
      return null;
    }

    const candidates: RecommendationCandidate[] = group.designers.map((designer: any, index: number) => ({
      designerId: designer.id,
      score: context.utils.scoreDesigner(designer, { availabilityRequired: group.availability }),
      rank: index + 1,
      reasoning: group.availability ? 'Currently available for work' : 'Currently not available',
      metadata: {
        availabilityMatch: true,
        confidence: 70,
      },
    }));

    return {
      id: 0,
      type: 'create_list',
      title: `Create "${listName}" list`,
      description: `Group ${group.designers.length} ${group.availability ? 'available' : 'unavailable'} designers`,
      score,
      priority: group.availability ? 'medium' : 'low', // Available designers are higher priority
      candidates,
      reasoning: [
        `Found ${group.designers.length} ${group.availability ? 'available' : 'unavailable'} designers`,
        group.availability ? 'Ready for immediate projects' : 'Future availability tracking',
        `Average profile completeness: ${group.avgCompleteness}%`,
      ],
      metadata: {
        listType: 'availability-based',
        suggestedName: listName,
        commonAvailability: group.availability,
        designerCount: group.designers.length,
        avgCompleteness: group.avgCompleteness,
        actionUrl: '/lists/new',
        estimatedValue: this.estimateListValue(group.designers.length, 'availability-based'),
      },
      groupKey: `create_list_availability_${group.availability}`,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    };
  }

  // Helper methods for checking existing similar lists
  private findSimilarSkillList(skills: string[], existingLists: any[]): any | null {
    return existingLists.find(list => {
      const listSkills = this.extractSkillsFromList(list);
      return skills.some(skill => listSkills.includes(skill.toLowerCase()));
    });
  }

  private findSimilarLevelList(level: string, existingLists: any[]): any | null {
    return existingLists.find(list => {
      const listName = list.name.toLowerCase();
      return listName.includes(level.toLowerCase());
    });
  }

  private findSimilarLocationList(location: string, existingLists: any[]): any | null {
    return existingLists.find(list => {
      const listName = list.name.toLowerCase();
      return listName.includes(location.toLowerCase());
    });
  }

  private findSimilarAvailabilityList(availability: boolean, existingLists: any[]): any | null {
    const keyword = availability ? 'available' : 'unavailable';
    return existingLists.find(list => {
      const listName = list.name.toLowerCase();
      return listName.includes(keyword);
    });
  }

  private extractSkillsFromList(list: any): string[] {
    // Extract skills from existing list designers
    const allSkills = list.designers
      .flatMap((ld: any) => ld.designer?.skills || [])
      .map((skill: string) => skill.toLowerCase().trim());
    
    // Get most common skills (appearing in >30% of designers)
    const skillCounts = new Map<string, number>();
    for (const skill of allSkills) {
      skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
    }
    
    const threshold = Math.max(1, Math.ceil(list.designers.length * 0.3));
    return Array.from(skillCounts.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([skill]) => skill);
  }

  // Name generation methods
  private generateSkillBasedListName(skills: string[]): string {
    if (skills.length === 1) {
      return `${skills[0]} Specialists`;
    }
    return `${skills.join(' + ')} Experts`;
  }

  private generateLevelBasedListName(level: string): string {
    const capitalizedLevel = level.charAt(0).toUpperCase() + level.slice(1);
    return `${capitalizedLevel} Designers`;
  }

  private generateLocationBasedListName(location: string): string {
    return `${location} Based Designers`;
  }

  // Scoring methods
  private calculateSkillClusterScore(cluster: SkillCluster): number {
    let score = 30; // Base score

    // Designer count bonus
    score += Math.min(30, cluster.designers.length * 3);

    // Skills specificity bonus
    score += cluster.skills.length * 5;

    // Profile completeness bonus
    score += (cluster.avgCompleteness / 100) * 20;

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  private calculateLevelGroupScore(group: any): number {
    let score = 25; // Base score
    score += Math.min(35, group.designers.length * 4);
    score += (group.avgCompleteness / 100) * 15;
    return Math.round(Math.max(0, Math.min(100, score)));
  }

  private calculateLocationGroupScore(group: any): number {
    let score = 20; // Base score
    score += Math.min(40, group.designers.length * 5);
    score += (group.avgCompleteness / 100) * 15;
    return Math.round(Math.max(0, Math.min(100, score)));
  }

  private calculateAvailabilityGroupScore(group: any): number {
    let score = group.availability ? 30 : 15; // Available designers get higher base score
    score += Math.min(35, group.designers.length * 3);
    score += (group.avgCompleteness / 100) * 15;
    return Math.round(Math.max(0, Math.min(100, score)));
  }

  private calculateCreateListPriority(designerCount: number, score: number): string {
    if (score >= 70 && designerCount >= 8) return 'high';
    if (score >= 60 && designerCount >= 5) return 'medium';
    return 'low';
  }

  private estimateListValue(designerCount: number, listType: string): string {
    const values = {
      'skill-based': designerCount >= 8 ? 'High - Strong specialization' : 'Medium - Good skill focus',
      'level-based': designerCount >= 6 ? 'Medium - Clear experience grouping' : 'Low - Small experience group',
      'location-based': designerCount >= 5 ? 'Medium - Good geographic coverage' : 'Low - Limited local reach',
      'availability-based': designerCount >= 8 ? 'Medium - Good availability pool' : 'Low - Limited availability',
    };

    return values[listType as keyof typeof values] || 'Low potential';
  }
}