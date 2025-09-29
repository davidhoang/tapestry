import { db } from "@db";
import { designers } from "@db/schema";
import { eq, desc, and, lt, sql } from "drizzle-orm";
import { 
  RecommendationGenerator, 
  GeneratorContext 
} from "../recommendation-engine";
import { 
  RecommendationResult, 
  RecommendationCandidate
} from "../recommendation-utils";

interface ProfileIssue {
  type: 'missing_field' | 'outdated_info' | 'incomplete_skills' | 'low_quality';
  field?: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  impact: string;
}

/**
 * Update Profile Generator
 * 
 * Identifies designers with outdated, incomplete, or low-quality profiles
 * and suggests improvements to make them more discoverable and hireable.
 */
export class UpdateProfileGenerator implements RecommendationGenerator {
  
  getType(): string {
    return 'update_profile';
  }

  async isEnabled(context: GeneratorContext): Promise<boolean> {
    // Always enabled - profile quality is always improvable
    return true;
  }

  async generate(context: GeneratorContext): Promise<RecommendationResult[]> {
    const recommendations: RecommendationResult[] = [];

    // Get all designers in the workspace
    const allDesigners = await db.query.designers.findMany({
      where: eq(designers.workspaceId, context.workspaceId),
      orderBy: desc(designers.createdAt),
    });

    if (allDesigners.length === 0) {
      return [];
    }

    // Analyze each designer for profile issues
    const designersWithIssues: Array<{
      designer: any;
      issues: ProfileIssue[];
      completeness: number;
      priority: string;
    }> = [];

    for (const designer of allDesigners) {
      const issues = this.analyzeProfileIssues(designer, context);
      const completeness = context.utils.calculateProfileCompleteness(designer);
      const priority = this.calculateUpdatePriority(issues, completeness);

      if (issues.length > 0) {
        designersWithIssues.push({
          designer,
          issues,
          completeness,
          priority,
        });
      }
    }

    // Group designers by issue types for better recommendations
    const groupedRecommendations = this.groupDesignersByIssues(designersWithIssues, context);

    recommendations.push(...groupedRecommendations);

    // Create individual recommendations for high-priority cases
    const individualRecommendations = this.createIndividualRecommendations(
      designersWithIssues.filter(d => d.priority === 'high'),
      context
    );

    recommendations.push(...individualRecommendations);

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 15); // Limit to top 15 recommendations
  }

  private analyzeProfileIssues(designer: any, context: GeneratorContext): ProfileIssue[] {
    const issues: ProfileIssue[] = [];

    // Check for missing critical fields
    const criticalFields = [
      { field: 'photoUrl', name: 'profile photo', impact: 'Profiles with photos get 3x more views' },
      { field: 'description', name: 'description', impact: 'Descriptions help hirers understand your expertise' },
      { field: 'website', name: 'portfolio website', impact: 'Portfolio links increase hire probability by 60%' },
      { field: 'location', name: 'location', impact: 'Location helps with local project matching' },
      { field: 'linkedIn', name: 'LinkedIn profile', impact: 'LinkedIn profiles build credibility' },
    ];

    for (const field of criticalFields) {
      if (!designer[field.field] || designer[field.field].toString().trim().length === 0) {
        issues.push({
          type: 'missing_field',
          field: field.field,
          severity: field.field === 'photoUrl' || field.field === 'description' ? 'high' : 'medium',
          description: `Missing ${field.name}`,
          impact: field.impact,
        });
      }
    }

    // Check for incomplete skills
    const skills = designer.skills || [];
    if (skills.length < 3) {
      issues.push({
        type: 'incomplete_skills',
        severity: 'high',
        description: `Only ${skills.length} skills listed`,
        impact: 'More skills increase match opportunities by 40%',
      });
    } else if (skills.length < 5) {
      issues.push({
        type: 'incomplete_skills',
        severity: 'medium',
        description: `Limited skills (${skills.length}) - consider adding more`,
        impact: 'Additional skills help with broader project matching',
      });
    }

    // Check for outdated information (based on creation date as proxy)
    const daysSinceCreation = (Date.now() - new Date(designer.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > 90 && !this.hasRecentUpdates(designer)) {
      issues.push({
        type: 'outdated_info',
        severity: 'medium',
        description: `Profile hasn't been updated in ${Math.round(daysSinceCreation)} days`,
        impact: 'Regular updates show active engagement',
      });
    }

    // Check for low-quality content
    if (designer.description && designer.description.length < 50) {
      issues.push({
        type: 'low_quality',
        field: 'description',
        severity: 'medium',
        description: 'Description is too brief (less than 50 characters)',
        impact: 'Longer descriptions (100+ chars) perform 2x better',
      });
    }

    // Check for generic titles
    if (designer.title && this.isGenericTitle(designer.title)) {
      issues.push({
        type: 'low_quality',
        field: 'title',
        severity: 'low',
        description: 'Title could be more specific',
        impact: 'Specific titles like "Senior React Developer" perform better than "Developer"',
      });
    }

    return issues;
  }

  private hasRecentUpdates(designer: any): boolean {
    // This is a simplified check - in practice, you might track update timestamps
    // For now, we assume recent updates if profile has good completeness
    const completeness = this.calculateBasicCompleteness(designer);
    return completeness > 80;
  }

  private calculateBasicCompleteness(designer: any): number {
    const fields = ['photoUrl', 'description', 'website', 'location', 'linkedIn'];
    const filledFields = fields.filter(field => 
      designer[field] && designer[field].toString().trim().length > 0
    ).length;
    
    const skillScore = Math.min(20, (designer.skills?.length || 0) * 4);
    const fieldScore = (filledFields / fields.length) * 80;
    
    return fieldScore + skillScore;
  }

  private isGenericTitle(title: string): boolean {
    const genericTitles = [
      'designer', 'developer', 'freelancer', 'consultant', 'artist', 'creator',
      'professional', 'expert', 'specialist', 'worker'
    ];
    
    const normalizedTitle = title.toLowerCase().trim();
    return genericTitles.some(generic => normalizedTitle === generic);
  }

  private calculateUpdatePriority(issues: ProfileIssue[], completeness: number): string {
    const highSeverityCount = issues.filter(i => i.severity === 'high').length;
    const mediumSeverityCount = issues.filter(i => i.severity === 'medium').length;

    if (completeness < 40 || highSeverityCount >= 2) {
      return 'high';
    }

    if (completeness < 70 || highSeverityCount >= 1 || mediumSeverityCount >= 3) {
      return 'medium';
    }

    return 'low';
  }

  private groupDesignersByIssues(
    designersWithIssues: Array<{
      designer: any;
      issues: ProfileIssue[];
      completeness: number;
      priority: string;
    }>,
    context: GeneratorContext
  ): RecommendationResult[] {
    const grouped = new Map<string, any[]>();

    // Group by common issue types
    for (const entry of designersWithIssues) {
      for (const issue of entry.issues) {
        const key = issue.field ? `${issue.type}_${issue.field}` : issue.type;
        
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        
        if (!grouped.get(key)!.some(existing => existing.designer.id === entry.designer.id)) {
          grouped.get(key)!.push({
            ...entry,
            specificIssue: issue,
          });
        }
      }
    }

    const recommendations: RecommendationResult[] = [];

    for (const [issueKey, entries] of Array.from(grouped.entries())) {
      if (entries.length >= 3) { // Only create group recommendations for 3+ designers
        const recommendation = this.createGroupRecommendation(issueKey, entries, context);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }
    }

    return recommendations;
  }

  private createGroupRecommendation(
    issueKey: string,
    entries: any[],
    context: GeneratorContext
  ): RecommendationResult | null {
    const firstIssue = entries[0].specificIssue;
    const designers = entries.map(e => e.designer);

    const title = this.generateGroupTitle(firstIssue, entries.length);
    const description = this.generateGroupDescription(firstIssue, entries.length);

    const candidates: RecommendationCandidate[] = entries.map((entry, index) => ({
      designerId: entry.designer.id,
      score: this.calculateDesignerUpdateScore(entry.designer, entry.issues, context),
      rank: index + 1,
      reasoning: this.generateUpdateReasoning(entry.issues),
      metadata: {
        issues: entry.issues.map((i: ProfileIssue) => i.type),
        completeness: entry.completeness,
        priority: entry.priority,
        mainIssue: firstIssue.type,
      },
    }));

    // Sort candidates by priority and score
    candidates.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.metadata.priority as keyof typeof priorityOrder] || 0;
      const bPriority = priorityOrder[b.metadata.priority as keyof typeof priorityOrder] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return b.score - a.score;
    });

    // Update ranks
    candidates.forEach((candidate, index) => {
      candidate.rank = index + 1;
    });

    const groupScore = this.calculateGroupUpdateScore(entries);

    return {
      id: 0,
      type: 'update_profile',
      title,
      description,
      score: groupScore,
      priority: this.calculateGroupPriority(entries),
      candidates,
      reasoning: [
        `${entries.length} designers have ${firstIssue.description.toLowerCase()}`,
        firstIssue.impact,
        `Average profile completeness: ${Math.round(entries.reduce((sum, e) => sum + e.completeness, 0) / entries.length)}%`,
      ],
      metadata: {
        issueType: firstIssue.type,
        issueField: firstIssue.field,
        designerCount: entries.length,
        avgCompleteness: Math.round(entries.reduce((sum, e) => sum + e.completeness, 0) / entries.length),
        highPriorityCount: entries.filter(e => e.priority === 'high').length,
        actionUrl: '/directory',
        estimatedValue: this.estimateUpdateValue(entries.length, firstIssue.type),
      },
      groupKey: `update_profile_${issueKey}`,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };
  }

  private createIndividualRecommendations(
    highPriorityEntries: Array<{
      designer: any;
      issues: ProfileIssue[];
      completeness: number;
      priority: string;
    }>,
    context: GeneratorContext
  ): RecommendationResult[] {
    return highPriorityEntries.slice(0, 5).map(entry => { // Limit to top 5 individual recommendations
      const mainIssue = entry.issues.find(i => i.severity === 'high') || entry.issues[0];

      return {
        id: 0,
        type: 'update_profile',
        title: `Update ${entry.designer.name}'s profile`,
        description: `${entry.designer.name} has ${entry.issues.length} profile improvements to make`,
        score: this.calculateDesignerUpdateScore(entry.designer, entry.issues, context),
        priority: 'high',
        candidates: [{
          designerId: entry.designer.id,
          score: this.calculateDesignerUpdateScore(entry.designer, entry.issues, context),
          rank: 1,
          reasoning: this.generateUpdateReasoning(entry.issues),
          metadata: {
            issues: entry.issues.map(i => i.type),
            completeness: entry.completeness,
            priority: entry.priority,
            mainIssue: mainIssue.type,
          },
        }],
        reasoning: [
          `Profile completeness: ${entry.completeness}%`,
          mainIssue.description,
          mainIssue.impact,
        ],
        metadata: {
          designerId: entry.designer.id,
          designerName: entry.designer.name,
          issueCount: entry.issues.length,
          completeness: entry.completeness,
          mainIssue: mainIssue.type,
          actionUrl: `/designers/${entry.designer.id}/edit`,
          estimatedValue: 'High - Individual attention needed',
        },
        groupKey: `update_profile_individual_${entry.designer.id}`,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      };
    });
  }

  private generateGroupTitle(issue: ProfileIssue, count: number): string {
    const titles = {
      'missing_field_photoUrl': `Add profile photos for ${count} designers`,
      'missing_field_description': `Add descriptions for ${count} designers`,
      'missing_field_website': `Add portfolio links for ${count} designers`,
      'missing_field_location': `Add locations for ${count} designers`,
      'missing_field_linkedIn': `Add LinkedIn profiles for ${count} designers`,
      'incomplete_skills': `Expand skills for ${count} designers`,
      'outdated_info': `Update information for ${count} designers`,
      'low_quality': `Improve content quality for ${count} designers`,
    };

    const key = issue.field ? `${issue.type}_${issue.field}` : issue.type;
    return titles[key as keyof typeof titles] || `Update profiles for ${count} designers`;
  }

  private generateGroupDescription(issue: ProfileIssue, count: number): string {
    return `${count} designers could benefit from ${issue.description.toLowerCase()}. ${issue.impact}`;
  }

  private generateUpdateReasoning(issues: ProfileIssue[]): string {
    const reasons = issues.slice(0, 3).map(issue => issue.description);
    return reasons.join('. ') + '.';
  }

  private calculateDesignerUpdateScore(designer: any, issues: ProfileIssue[], context: GeneratorContext): number {
    let score = 100 - context.utils.calculateProfileCompleteness(designer);

    // Add score based on issue severity
    for (const issue of issues) {
      switch (issue.severity) {
        case 'high':
          score += 15;
          break;
        case 'medium':
          score += 10;
          break;
        case 'low':
          score += 5;
          break;
      }
    }

    // Bonus for designers with some engagement (has skills, title, etc.)
    if (designer.skills && designer.skills.length > 0) {
      score += 5;
    }

    if (designer.title && designer.title.trim().length > 0) {
      score += 5;
    }

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  private calculateGroupUpdateScore(entries: any[]): number {
    const avgIndividualScore = entries.reduce((sum, entry) => {
      return sum + this.calculateDesignerUpdateScore(entry.designer, entry.issues, { utils: { calculateProfileCompleteness: () => 50 } } as any);
    }, 0) / entries.length;

    let groupScore = avgIndividualScore;

    // Bonus for large groups (economies of scale)
    if (entries.length >= 10) {
      groupScore += 15;
    } else if (entries.length >= 5) {
      groupScore += 10;
    }

    // Bonus for consistent issue types (easier to batch)
    const issueTypes = new Set(entries.flatMap(e => e.issues.map((i: ProfileIssue) => i.type)));
    if (issueTypes.size === 1) {
      groupScore += 10;
    }

    return Math.round(Math.max(0, Math.min(100, groupScore)));
  }

  private calculateGroupPriority(entries: any[]): string {
    const highPriorityCount = entries.filter(e => e.priority === 'high').length;
    const mediumPriorityCount = entries.filter(e => e.priority === 'medium').length;

    if (highPriorityCount >= entries.length * 0.5) {
      return 'high';
    }

    if (highPriorityCount > 0 || mediumPriorityCount >= entries.length * 0.5) {
      return 'medium';
    }

    return 'low';
  }

  private estimateUpdateValue(designerCount: number, issueType: string): string {
    const valueMap = {
      'missing_field': `Medium - ${designerCount} profiles with missing critical information`,
      'incomplete_skills': `High - Skills drive ${designerCount * 40}% more matches`,
      'outdated_info': `Medium - Fresh profiles for ${designerCount} designers`,
      'low_quality': `Medium - Improved content quality for ${designerCount} profiles`,
    };

    return valueMap[issueType as keyof typeof valueMap] || `Medium - Profile improvements for ${designerCount} designers`;
  }
}