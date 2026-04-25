import { db } from "@db";
import { designers, designerOutreach, userLocations, lists, jobs } from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { 
  RecommendationGenerator, 
  GeneratorContext 
} from "../recommendation-engine";
import { 
  RecommendationResult, 
  RecommendationCandidate
} from "../recommendation-utils";

interface DesignerOutreachInfo {
  designer: any;
  lastOutreach: Date | null;
  daysSinceContact: number | null;
  locationMatch: boolean;
  userCity: string | null;
  designerCity: string | null;
  trigger: string | null;
  triggerDetail: string | null;
}

const MAX_RECOMMENDATIONS = 5;
const LONG_GAP_DAYS = 60;
const HIGH_COMPLETENESS_THRESHOLD = 60;

const COMMON_SKILLS = [
  'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator',
  'react', 'vue', 'angular', 'javascript', 'typescript',
  'html', 'css', 'sass', 'tailwind', 'ui', 'ux', 'design',
  'prototyping', 'wireframing', 'user research', 'product design',
  'motion design', 'animation', 'branding', 'graphic design',
  'interaction design', 'visual design', 'design systems',
];

export class ReachOutGenerator implements RecommendationGenerator {
  
  getType(): string {
    return 'reach_out';
  }

  async isEnabled(context: GeneratorContext): Promise<boolean> {
    const designerCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(designers)
      .where(eq(designers.workspaceId, context.workspaceId));

    return designerCount[0]?.count > 0;
  }

  async generate(context: GeneratorContext): Promise<RecommendationResult[]> {
    const allDesigners = await db.query.designers.findMany({
      where: eq(designers.workspaceId, context.workspaceId),
      orderBy: desc(designers.createdAt),
    });

    if (allDesigners.length === 0) {
      return [];
    }

    const userLocation = await db.query.userLocations.findFirst({
      where: and(
        eq(userLocations.userId, context.userId),
        eq(userLocations.consentGranted, true)
      ),
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

    const listMatchesByDesigner = this.findListMatches(allDesigners, workspaceLists, context);
    const roleMatchesByDesigner = this.findRoleMatches(allDesigners, activeJobs, context);

    const designerInfoList: DesignerOutreachInfo[] = allDesigners.map(designer => {
      const lastOutreach = lastOutreachByDesigner.get(designer.id) || null;
      const daysSinceContact = lastOutreach 
        ? Math.floor((Date.now() - lastOutreach.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      
      const locationMatch = this.checkLocationMatch(designer.location, userLocation?.city ?? null);
      
      return {
        designer,
        lastOutreach,
        daysSinceContact,
        locationMatch,
        userCity: userLocation?.city || null,
        designerCity: this.extractCity(designer.location),
        trigger: null,
        triggerDetail: null,
      };
    });

    const triggered = this.applySignalTriggers(designerInfoList, listMatchesByDesigner, roleMatchesByDesigner, context);

    const sorted = triggered.sort((a, b) => {
      const scoreA = this.calculatePriorityScore(a);
      const scoreB = this.calculatePriorityScore(b);
      return scoreB - scoreA;
    });

    const recommendations: RecommendationResult[] = [];
    for (const info of sorted.slice(0, MAX_RECOMMENDATIONS)) {
      recommendations.push(this.createRecommendation(info, context));
    }

    return recommendations;
  }

  private applySignalTriggers(
    designerInfoList: DesignerOutreachInfo[],
    listMatchesByDesigner: Map<number, { listName: string; score: number }>,
    roleMatchesByDesigner: Map<number, { jobTitle: string; score: number }>,
    context: GeneratorContext
  ): DesignerOutreachInfo[] {
    const triggered: DesignerOutreachInfo[] = [];

    for (const info of designerInfoList) {
      const neverContacted = info.daysSinceContact === null;
      const completeness = context.utils.calculateProfileCompleteness(info.designer);

      if (info.designer.available && neverContacted) {
        triggered.push({
          ...info,
          trigger: 'just_available',
          triggerDetail: 'Just went available',
        });
        continue;
      }

      const listMatch = listMatchesByDesigner.get(info.designer.id);
      if (listMatch && listMatch.score >= 60) {
        triggered.push({
          ...info,
          trigger: 'list_match',
          triggerDetail: `Top match for your ${listMatch.listName} list`,
        });
        continue;
      }

      const roleMatch = roleMatchesByDesigner.get(info.designer.id);
      if (roleMatch && roleMatch.score >= 60) {
        triggered.push({
          ...info,
          trigger: 'role_match',
          triggerDetail: `Strong fit for ${roleMatch.jobTitle} role`,
        });
        continue;
      }

      if (
        info.daysSinceContact !== null &&
        info.daysSinceContact >= LONG_GAP_DAYS &&
        completeness > HIGH_COMPLETENESS_THRESHOLD
      ) {
        const months = Math.floor(info.daysSinceContact / 30);
        const timePhrase = months >= 2 ? `${months} months` : `${info.daysSinceContact} days`;
        triggered.push({
          ...info,
          trigger: 'long_gap_high_value',
          triggerDetail: `Haven't spoken in ${timePhrase} — high-value contact`,
        });
        continue;
      }
    }

    return triggered;
  }

  private findRoleMatches(
    allDesigners: any[],
    activeJobs: any[],
    context: GeneratorContext
  ): Map<number, { jobTitle: string; score: number }> {
    const matches = new Map<number, { jobTitle: string; score: number }>();

    for (const job of activeJobs) {
      const requiredSkills = this.extractSkillsFromJobDescription(job.description);

      for (const designer of allDesigners) {
        const score = context.utils.scoreDesigner(designer, {
          requiredSkills,
        });

        const existing = matches.get(designer.id);
        if (!existing || score > existing.score) {
          matches.set(designer.id, { jobTitle: job.title, score });
        }
      }
    }

    return matches;
  }

  private extractSkillsFromJobDescription(description: string): string[] {
    const lowerDescription = description.toLowerCase();
    return COMMON_SKILLS.filter(skill => lowerDescription.includes(skill));
  }

  private findListMatches(
    allDesigners: any[],
    workspaceLists: any[],
    context: GeneratorContext
  ): Map<number, { listName: string; score: number }> {
    const matches = new Map<number, { listName: string; score: number }>();

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

      for (const designer of allDesigners) {
        if (existingIds.has(designer.id)) continue;

        const score = context.utils.scoreDesigner(designer, {
          requiredSkills: commonSkills,
          preferredLevel,
        });

        const existing = matches.get(designer.id);
        if (!existing || score > existing.score) {
          matches.set(designer.id, { listName: list.name, score });
        }
      }
    }

    return matches;
  }

  private checkLocationMatch(designerLocation: string | null, userCity: string | null): boolean {
    if (!designerLocation || !userCity) {
      return false;
    }

    const normalizedDesignerLocation = designerLocation.toLowerCase().trim();
    const normalizedUserCity = userCity.toLowerCase().trim();

    return normalizedDesignerLocation.includes(normalizedUserCity) ||
           normalizedUserCity.includes(normalizedDesignerLocation);
  }

  private extractCity(location: string | null): string | null {
    if (!location) return null;
    
    const parts = location.split(',').map(p => p.trim());
    return parts[0] || location;
  }

  private calculatePriorityScore(info: DesignerOutreachInfo): number {
    let score = 0;

    if (info.trigger === 'just_available') {
      score += 90;
    } else if (info.trigger === 'list_match') {
      score += 85;
    } else if (info.trigger === 'role_match') {
      score += 80;
    } else if (info.trigger === 'long_gap_high_value') {
      score += 70;
    }

    if (info.designer.available) {
      score += 10;
    }

    if (info.locationMatch) {
      score += 5;
    }

    return score;
  }

  private createRecommendation(
    info: DesignerOutreachInfo, 
    context: GeneratorContext
  ): RecommendationResult {
    const triggerPhrase = info.triggerDetail || 'Signal-based recommendation';
    
    let priority: string;
    let score: number;
    let title: string;
    let description: string;
    let reasoning: string[];

    switch (info.trigger) {
      case 'just_available':
        title = `Reach out to ${info.designer.name}`;
        description = `${info.designer.name} is available and hasn't been contacted yet. Great time to connect.`;
        priority = 'high';
        score = 90;
        reasoning = [
          triggerPhrase,
          `${info.designer.title || 'Designer'} at ${info.designer.company || 'their company'}`,
          'Currently available for work',
        ];
        break;

      case 'list_match':
        title = `Reach out to ${info.designer.name}`;
        description = `${info.designer.name} is a strong match for one of your lists. Consider reaching out.`;
        priority = 'high';
        score = 85;
        reasoning = [
          triggerPhrase,
          `${info.designer.title || 'Designer'}`,
          info.designer.available ? 'Currently available for work' : 'Check availability',
        ];
        break;

      case 'role_match':
        title = `Reach out to ${info.designer.name}`;
        description = `${info.designer.name} is a strong fit for an active role. Consider reaching out.`;
        priority = 'high';
        score = 83;
        reasoning = [
          triggerPhrase,
          `${info.designer.title || 'Designer'}`,
          info.designer.available ? 'Currently available for work' : 'Check availability',
        ];
        break;

      case 'long_gap_high_value':
        title = `Reconnect with ${info.designer.name}`;
        description = `It's been a while since you last contacted ${info.designer.name}. They have a strong profile worth reconnecting over.`;
        priority = 'medium';
        score = 75;
        reasoning = [
          triggerPhrase,
          `Last contacted ${info.daysSinceContact} days ago`,
          info.designer.available ? 'Currently available for work' : 'Check availability',
        ];
        break;

      default:
        title = `Reach out to ${info.designer.name}`;
        description = `Consider reaching out to ${info.designer.name}.`;
        priority = 'low';
        score = 50;
        reasoning = [triggerPhrase];
        break;
    }

    const candidate: RecommendationCandidate = {
      designerId: info.designer.id,
      score,
      rank: 1,
      reasoning: description,
      metadata: {
        lastOutreach: info.lastOutreach?.toISOString() || null,
        daysSinceContact: info.daysSinceContact,
        locationMatch: info.locationMatch,
        trigger: info.trigger,
      },
    };

    return {
      id: 0,
      type: 'reach_out',
      title,
      description,
      score,
      priority,
      candidates: [candidate],
      reasoning,
      metadata: {
        designerId: info.designer.id,
        designerName: info.designer.name,
        lastOutreach: info.lastOutreach?.toISOString() || null,
        daysSinceContact: info.daysSinceContact,
        locationMatch: info.locationMatch,
        userCity: info.userCity,
        designerCity: info.designerCity,
        trigger: info.trigger,
        triggerDetail: info.triggerDetail,
        actionUrl: `/designers/${info.designer.id}`,
      },
      groupKey: `reach_out_${info.designer.id}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }
}
