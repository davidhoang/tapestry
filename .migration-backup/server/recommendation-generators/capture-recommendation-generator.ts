import { db } from "@db";
import { captureEntries, captureAnnotations, designers } from "@db/schema";
import { eq, and, sql, isNotNull } from "drizzle-orm";
import { 
  RecommendationGenerator, 
  GeneratorContext 
} from "../recommendation-engine";
import { 
  RecommendationResult, 
  RecommendationCandidate
} from "../recommendation-utils";

interface ExtractedEntity {
  names?: Array<{ value: string; confidence: number }>;
  companies?: Array<{ value: string; confidence: number }>;
  skills?: Array<{ value: string; confidence: number }>;
  emails?: string[];
  linkedinUrls?: string[];
  portfolioUrls?: string[];
  locations?: string[];
  titles?: string[];
  [key: string]: any;
}

interface SuggestedAction {
  actionType: 'create_designer' | 'enrich_profile' | 'add_to_list';
  confidence: number;
  targetDesignerId?: number;
  targetListId?: number;
  reasoning: string;
  extractedData?: Record<string, any>;
}

export class CaptureRecommendationGenerator implements RecommendationGenerator {
  
  getType(): string {
    return 'capture_discovery';
  }

  async isEnabled(context: GeneratorContext): Promise<boolean> {
    const processedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(captureEntries)
      .innerJoin(captureAnnotations, eq(captureAnnotations.entryId, captureEntries.id))
      .where(
        and(
          eq(captureEntries.workspaceId, context.workspaceId),
          eq(captureEntries.status, 'processed')
        )
      );

    return (processedCount[0]?.count || 0) > 0;
  }

  async generate(context: GeneratorContext): Promise<RecommendationResult[]> {
    const recommendations: RecommendationResult[] = [];

    const processedEntries = await db.query.captureEntries.findMany({
      where: and(
        eq(captureEntries.workspaceId, context.workspaceId),
        eq(captureEntries.status, 'processed')
      ),
      with: {
        annotations: {
          with: {
            matchedDesigner: true,
          },
        },
      },
    });

    for (const entry of processedEntries) {
      try {
        const entryRecommendations = await this.generateForEntry(entry, context);
        recommendations.push(...entryRecommendations);
      } catch (error) {
        console.error(`Error generating recommendations for capture entry ${entry.id}:`, error);
      }
    }

    return recommendations;
  }

  private async generateForEntry(
    entry: any, 
    context: GeneratorContext
  ): Promise<RecommendationResult[]> {
    const recommendations: RecommendationResult[] = [];

    for (const annotation of entry.annotations) {
      const extractedEntities = annotation.extractedEntities as ExtractedEntity | null;
      const suggestedActions = annotation.suggestedActions as SuggestedAction[] | null;

      if (!extractedEntities && !suggestedActions) {
        continue;
      }

      const primaryName = this.getPrimaryName(extractedEntities);
      const hasMatchedDesigner = annotation.matchedDesignerId !== null;

      if (hasMatchedDesigner) {
        const enrichRecommendation = await this.createEnrichRecommendation(
          entry,
          annotation,
          extractedEntities,
          suggestedActions,
          primaryName,
          context
        );
        if (enrichRecommendation) {
          recommendations.push(enrichRecommendation);
        }
      } else {
        const createRecommendation = await this.createNewProfileRecommendation(
          entry,
          annotation,
          extractedEntities,
          suggestedActions,
          primaryName,
          context
        );
        if (createRecommendation) {
          recommendations.push(createRecommendation);
        }
      }
    }

    return recommendations;
  }

  private getPrimaryName(entities: ExtractedEntity | null): string {
    if (!entities?.names || entities.names.length === 0) {
      return 'Unknown Designer';
    }
    const sortedNames = [...entities.names].sort((a, b) => b.confidence - a.confidence);
    return sortedNames[0].value;
  }

  private calculateConfidenceScore(
    entities: ExtractedEntity | null,
    suggestedActions: SuggestedAction[] | null
  ): number {
    let score = 0;
    let factors = 0;

    if (entities?.names && entities.names.length > 0) {
      const avgNameConfidence = entities.names.reduce((sum, n) => sum + n.confidence, 0) / entities.names.length;
      score += avgNameConfidence * 30;
      factors += 30;
    }

    if (entities?.skills && entities.skills.length > 0) {
      const avgSkillConfidence = entities.skills.reduce((sum, s) => sum + s.confidence, 0) / entities.skills.length;
      score += avgSkillConfidence * 25;
      factors += 25;
    }

    if (entities?.emails && entities.emails.length > 0) {
      score += 15;
      factors += 15;
    }

    if (entities?.linkedinUrls && entities.linkedinUrls.length > 0) {
      score += 15;
      factors += 15;
    }

    if (entities?.titles && entities.titles.length > 0) {
      score += 10;
      factors += 10;
    }

    if (entities?.locations && entities.locations.length > 0) {
      score += 5;
      factors += 5;
    }

    if (suggestedActions && suggestedActions.length > 0) {
      const topAction = suggestedActions.reduce((best, action) => 
        action.confidence > best.confidence ? action : best
      , suggestedActions[0]);
      score += topAction.confidence * 20;
      factors += 20;
    }

    return factors > 0 ? Math.round((score / factors) * 100) : 50;
  }

  private generateReasoning(
    entities: ExtractedEntity | null,
    suggestedActions: SuggestedAction[] | null,
    isEnrich: boolean
  ): string[] {
    const reasons: string[] = [];

    if (entities?.names && entities.names.length > 0) {
      reasons.push(`Identified designer: ${entities.names[0].value}`);
    }

    if (entities?.skills && entities.skills.length > 0) {
      const skillList = entities.skills.slice(0, 3).map(s => s.value).join(', ');
      reasons.push(`Skills detected: ${skillList}`);
    }

    if (entities?.emails && entities.emails.length > 0) {
      reasons.push(`Contact email found`);
    }

    if (entities?.linkedinUrls && entities.linkedinUrls.length > 0) {
      reasons.push(`LinkedIn profile available`);
    }

    if (entities?.companies && entities.companies.length > 0) {
      reasons.push(`Company affiliation: ${entities.companies[0].value}`);
    }

    if (suggestedActions && suggestedActions.length > 0) {
      const topAction = suggestedActions[0];
      if (topAction.reasoning) {
        reasons.push(topAction.reasoning);
      }
    }

    if (isEnrich) {
      reasons.push('New information can be merged with existing profile');
    } else {
      reasons.push('No existing profile match found - recommended for creation');
    }

    return reasons.slice(0, 5);
  }

  private async createEnrichRecommendation(
    entry: any,
    annotation: any,
    entities: ExtractedEntity | null,
    suggestedActions: SuggestedAction[] | null,
    primaryName: string,
    context: GeneratorContext
  ): Promise<RecommendationResult | null> {
    const score = this.calculateConfidenceScore(entities, suggestedActions);
    const reasoning = this.generateReasoning(entities, suggestedActions, true);

    const extractedData = {
      name: primaryName,
      skills: entities?.skills?.map(s => s.value) || [],
      email: entities?.emails?.[0],
      linkedIn: entities?.linkedinUrls?.[0],
      website: entities?.portfolioUrls?.[0],
      location: entities?.locations?.[0],
      title: entities?.titles?.[0],
      company: entities?.companies?.[0]?.value,
    };

    const groupKey = `capture_${entry.id}_${primaryName.replace(/\s+/g, '_').toLowerCase()}`;

    const candidates: RecommendationCandidate[] = [];
    if (annotation.matchedDesignerId) {
      candidates.push({
        designerId: annotation.matchedDesignerId,
        score: score,
        rank: 1,
        reasoning: `Matched existing profile with ${score}% confidence`,
        metadata: {
          matchType: 'enrichment',
          extractedData,
        },
      });
    }

    return {
      id: 0,
      type: 'capture_enrich_profile',
      title: `Enrich profile: ${primaryName}`,
      description: this.buildEnrichDescription(entities, annotation.aiSummary),
      score,
      priority: this.calculatePriority(score),
      candidates,
      reasoning,
      metadata: {
        captureEntryId: entry.id,
        annotationId: annotation.id,
        extractedData,
        action: 'enrich_existing',
        matchedDesignerId: annotation.matchedDesignerId,
        designerId: annotation.matchedDesignerId,
        contentType: entry.contentType,
        source: entry.metadata?.source,
        aiSummary: annotation.aiSummary,
        actionUrl: `/capture/${entry.id}`,
      },
      groupKey,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    };
  }

  private async createNewProfileRecommendation(
    entry: any,
    annotation: any,
    entities: ExtractedEntity | null,
    suggestedActions: SuggestedAction[] | null,
    primaryName: string,
    context: GeneratorContext
  ): Promise<RecommendationResult | null> {
    const score = this.calculateConfidenceScore(entities, suggestedActions);
    const reasoning = this.generateReasoning(entities, suggestedActions, false);

    const extractedData = {
      name: primaryName,
      skills: entities?.skills?.map(s => s.value) || [],
      email: entities?.emails?.[0],
      linkedIn: entities?.linkedinUrls?.[0],
      website: entities?.portfolioUrls?.[0],
      location: entities?.locations?.[0],
      title: entities?.titles?.[0],
      company: entities?.companies?.[0]?.value,
    };

    const groupKey = `capture_${entry.id}_${primaryName.replace(/\s+/g, '_').toLowerCase()}`;

    return {
      id: 0,
      type: 'capture_create_designer',
      title: `Review captured designer: ${primaryName}`,
      description: this.buildCreateDescription(entities, annotation.aiSummary),
      score,
      priority: this.calculatePriority(score),
      candidates: [],
      reasoning,
      metadata: {
        captureEntryId: entry.id,
        annotationId: annotation.id,
        extractedData,
        action: 'create_new',
        contentType: entry.contentType,
        source: entry.metadata?.source,
        aiSummary: annotation.aiSummary,
        actionUrl: `/capture/${entry.id}`,
      },
      groupKey,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    };
  }

  private buildEnrichDescription(
    entities: ExtractedEntity | null,
    aiSummary: string | null
  ): string {
    const parts: string[] = [];

    if (aiSummary) {
      parts.push(aiSummary);
    } else {
      parts.push('New information captured that can enhance an existing profile.');
    }

    const newData: string[] = [];
    if (entities?.skills && entities.skills.length > 0) {
      newData.push(`${entities.skills.length} skill${entities.skills.length > 1 ? 's' : ''}`);
    }
    if (entities?.emails && entities.emails.length > 0) {
      newData.push('email contact');
    }
    if (entities?.linkedinUrls && entities.linkedinUrls.length > 0) {
      newData.push('LinkedIn profile');
    }

    if (newData.length > 0) {
      parts.push(`Update includes: ${newData.join(', ')}.`);
    }

    return parts.join(' ');
  }

  private buildCreateDescription(
    entities: ExtractedEntity | null,
    aiSummary: string | null
  ): string {
    const parts: string[] = [];

    if (aiSummary) {
      parts.push(aiSummary);
    } else {
      parts.push('Potential new designer discovered from captured content.');
    }

    const dataPoints: string[] = [];
    if (entities?.skills && entities.skills.length > 0) {
      dataPoints.push(`${entities.skills.length} skill${entities.skills.length > 1 ? 's' : ''}`);
    }
    if (entities?.emails && entities.emails.length > 0) {
      dataPoints.push('contact info');
    }
    if (entities?.titles && entities.titles.length > 0) {
      dataPoints.push('role/title');
    }
    if (entities?.companies && entities.companies.length > 0) {
      dataPoints.push('company');
    }

    if (dataPoints.length > 0) {
      parts.push(`Extracted: ${dataPoints.join(', ')}.`);
    }

    return parts.join(' ');
  }

  private calculatePriority(score: number): string {
    if (score >= 85) return 'high';
    if (score >= 70) return 'medium';
    return 'low';
  }
}
