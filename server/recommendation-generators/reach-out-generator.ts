import { db } from "@db";
import { designers, designerOutreach, userLocations } from "@db/schema";
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
}

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
    const recommendations: RecommendationResult[] = [];

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
      };
    });

    const sortedDesigners = this.prioritizeDesigners(designerInfoList);

    for (const info of sortedDesigners.slice(0, 15)) {
      const recommendation = this.createRecommendation(info, context);
      recommendations.push(recommendation);
    }

    return recommendations;
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

  private prioritizeDesigners(designerInfoList: DesignerOutreachInfo[]): DesignerOutreachInfo[] {
    return designerInfoList.sort((a, b) => {
      const scoreA = this.calculatePriorityScore(a);
      const scoreB = this.calculatePriorityScore(b);
      return scoreB - scoreA;
    });
  }

  private calculatePriorityScore(info: DesignerOutreachInfo): number {
    let score = 0;

    if (info.daysSinceContact === null) {
      score += 50;
    } else if (info.daysSinceContact >= 30) {
      score += 30 + Math.min(20, Math.floor((info.daysSinceContact - 30) / 10));
    } else {
      score += Math.max(0, info.daysSinceContact);
    }

    if (info.locationMatch) {
      score += 25;
    }

    if (info.designer.available) {
      score += 10;
    }

    const completeness = this.calculateBasicCompleteness(info.designer);
    score += Math.floor(completeness / 10);

    return score;
  }

  private calculateBasicCompleteness(designer: any): number {
    const fields = ['photoUrl', 'description', 'website', 'location', 'linkedIn', 'email'];
    const filledFields = fields.filter(field => 
      designer[field] && designer[field].toString().trim().length > 0
    ).length;
    
    return (filledFields / fields.length) * 100;
  }

  private createRecommendation(
    info: DesignerOutreachInfo, 
    context: GeneratorContext
  ): RecommendationResult {
    const neverContacted = info.daysSinceContact === null;
    const notContactedIn30Days = info.daysSinceContact !== null && info.daysSinceContact >= 30;
    
    let priority: string;
    let score: number;
    let title: string;
    let description: string;
    let reasoning: string[];

    if (info.locationMatch) {
      title = `In town: ${info.designer.name}`;
      description = `${info.designer.name} is in ${info.designerCity || 'your area'}. Great opportunity to connect locally.`;
      priority = neverContacted ? 'high' : 'medium';
      score = neverContacted ? 90 : 75;
      reasoning = [
        `Located in ${info.designerCity || 'your area'}`,
        neverContacted ? 'Never been contacted' : `Last contacted ${info.daysSinceContact} days ago`,
        info.designer.available ? 'Currently available for work' : 'Check availability',
      ];
    } else if (neverContacted) {
      title = `Reach out to ${info.designer.name}`;
      description = `You haven't reached out to ${info.designer.name} yet. Consider making initial contact.`;
      priority = 'high';
      score = 80;
      reasoning = [
        'Never been contacted',
        `${info.designer.title || 'Designer'} at ${info.designer.company || 'their company'}`,
        info.designer.available ? 'Currently available for work' : 'Check availability',
      ];
    } else if (notContactedIn30Days) {
      title = `Reach out to ${info.designer.name}`;
      description = `It's been ${info.daysSinceContact} days since you last contacted ${info.designer.name}. Time to reconnect.`;
      priority = 'medium';
      score = 60 + Math.min(20, Math.floor((info.daysSinceContact! - 30) / 5));
      reasoning = [
        `Last contacted ${info.daysSinceContact} days ago`,
        'Time to follow up or check in',
        info.designer.available ? 'Currently available for work' : 'Check availability',
      ];
    } else {
      title = `Reach out to ${info.designer.name}`;
      description = `Consider reaching out to ${info.designer.name} to maintain the relationship.`;
      priority = 'low';
      score = 40 + (info.daysSinceContact || 0);
      reasoning = [
        `Last contacted ${info.daysSinceContact} days ago`,
        'Maintain relationship',
        info.designer.available ? 'Currently available for work' : 'Check availability',
      ];
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
        actionUrl: `/designers/${info.designer.id}`,
      },
      groupKey: `reach_out_${info.designer.id}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }
}
