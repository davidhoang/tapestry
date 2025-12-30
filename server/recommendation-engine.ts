import { db } from "@db";
import { 
  inboxRecommendations, 
  inboxRecommendationCandidates,
  inboxRecommendationEvents,
  recommendationFeedback,
  designers,
  lists,
  listDesigners,
  workspaces,
  recommendationTypeEnum,
  recommendationStatusEnum
} from "@db/schema";
import { eq, and, desc, sql, ne, inArray, isNull, gte } from "drizzle-orm";
import crypto from "crypto";
import { AddToListGenerator } from "./recommendation-generators/add-to-list-generator";
import { CreateListGenerator } from "./recommendation-generators/create-list-generator";
import { UpdateProfileGenerator } from "./recommendation-generators/update-profile-generator";
import { CaptureRecommendationGenerator } from "./recommendation-generators/capture-recommendation-generator";
import { 
  RecommendationUtils, 
  RecommendationResult, 
  RecommendationCandidate 
} from "./recommendation-utils";

export interface RecommendationRequest {
  workspaceId: number;
  userId: number;
  types?: string[]; // Filter by recommendation types
  limit?: number;
  forceRefresh?: boolean;
}

export interface GeneratorContext {
  workspaceId: number;
  userId: number;
  utils: RecommendationUtils;
}

export interface RecommendationGenerator {
  generate(context: GeneratorContext): Promise<RecommendationResult[]>;
  getType(): string;
  isEnabled(context: GeneratorContext): Promise<boolean>;
}

/**
 * Core Recommendation Engine
 * 
 * Orchestrates the generation of recommendations using modular generators.
 * Handles scoring, deduplication, persistence, and RLHF integration.
 */
export class RecommendationEngine {
  private generators: Map<string, RecommendationGenerator> = new Map();
  private utils: RecommendationUtils;

  constructor() {
    this.utils = new RecommendationUtils();
    this.registerGenerators();
  }

  /**
   * Register all recommendation generators
   */
  private registerGenerators(): void {
    const generators: RecommendationGenerator[] = [
      new AddToListGenerator(),
      new CreateListGenerator(),
      new UpdateProfileGenerator(),
      new CaptureRecommendationGenerator(),
    ];

    for (const generator of generators) {
      this.generators.set(generator.getType(), generator);
    }
  }

  /**
   * Generate recommendations for a workspace
   */
  async generate(request: RecommendationRequest): Promise<RecommendationResult[]> {
    const context: GeneratorContext = {
      workspaceId: request.workspaceId,
      userId: request.userId,
      utils: this.utils,
    };

    console.log(`Generating recommendations for workspace ${request.workspaceId}, user ${request.userId}`);

    // Filter generators by requested types
    const activeGenerators = Array.from(this.generators.values()).filter(generator => {
      if (request.types && request.types.length > 0) {
        return request.types.includes(generator.getType());
      }
      return true;
    });

    // Generate recommendations from all active generators
    const allRecommendations: RecommendationResult[] = [];
    
    for (const generator of activeGenerators) {
      try {
        // Check if generator is enabled for this context
        const isEnabled = await generator.isEnabled(context);
        if (!isEnabled) {
          console.log(`Generator ${generator.getType()} is disabled for workspace ${request.workspaceId}`);
          continue;
        }

        console.log(`Running generator: ${generator.getType()}`);
        const recommendations = await generator.generate(context);
        allRecommendations.push(...recommendations);
        
        console.log(`Generator ${generator.getType()} generated ${recommendations.length} recommendations`);
      } catch (error) {
        console.error(`Error in generator ${generator.getType()}:`, error);
        // Continue with other generators
      }
    }

    // Apply scoring and deduplication
    const processedRecommendations = await this.processRecommendations(
      allRecommendations, 
      context
    );

    // Sort by score and apply limit
    const sortedRecommendations = processedRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, request.limit || 50);

    // Persist to database if not forcing refresh
    if (!request.forceRefresh) {
      await this.persistRecommendations(sortedRecommendations, context);
    }

    console.log(`Generated ${sortedRecommendations.length} final recommendations`);
    return sortedRecommendations;
  }

  /**
   * Process recommendations: apply RLHF learning, deduplication, and enhanced scoring
   */
  private async processRecommendations(
    recommendations: RecommendationResult[], 
    context: GeneratorContext
  ): Promise<RecommendationResult[]> {
    // Apply RLHF learning to adjust scores
    const learningAdjustedRecommendations = await this.applyRLHFLearning(recommendations, context);

    // Deduplicate recommendations
    const deduplicatedRecommendations = await this.deduplicateRecommendations(
      learningAdjustedRecommendations, 
      context
    );

    // Apply final scoring adjustments
    return this.applyFinalScoring(deduplicatedRecommendations, context);
  }

  /**
   * Apply RLHF learning to adjust recommendation scores based on historical feedback
   */
  private async applyRLHFLearning(
    recommendations: RecommendationResult[], 
    context: GeneratorContext
  ): Promise<RecommendationResult[]> {
    // Get historical feedback for this workspace
    const feedbackData = await db.query.recommendationFeedback.findMany({
      where: eq(recommendationFeedback.workspaceId, context.workspaceId),
      orderBy: desc(recommendationFeedback.createdAt),
      limit: 1000, // Use recent feedback
    });

    if (feedbackData.length === 0) {
      return recommendations; // No feedback to learn from
    }

    // Calculate feedback patterns
    const feedbackPatterns = this.utils.analyzeFeedbackPatterns(feedbackData);

    // Apply learning adjustments to each recommendation
    return recommendations.map(recommendation => {
      const adjustedScore = this.utils.applyFeedbackLearning(
        recommendation, 
        feedbackPatterns
      );

      return {
        ...recommendation,
        score: Math.max(0, Math.min(100, adjustedScore)), // Clamp to 0-100
      };
    });
  }

  /**
   * Deduplicate recommendations using composite hash keys
   */
  private async deduplicateRecommendations(
    recommendations: RecommendationResult[], 
    context: GeneratorContext
  ): Promise<RecommendationResult[]> {
    const dedupMap = new Map<string, RecommendationResult>();

    for (const recommendation of recommendations) {
      const dedupHash = this.utils.generateDedupHash(recommendation);
      
      // Check if we already have a similar recommendation
      const existing = dedupMap.get(dedupHash);
      
      if (!existing || recommendation.score > existing.score) {
        // Keep the higher-scored recommendation
        dedupMap.set(dedupHash, {
          ...recommendation,
          groupKey: dedupHash,
        });
      }
    }

    return Array.from(dedupMap.values());
  }

  /**
   * Apply final scoring adjustments based on priority, freshness, and workspace context
   */
  private applyFinalScoring(
    recommendations: RecommendationResult[], 
    context: GeneratorContext
  ): RecommendationResult[] {
    return recommendations.map(recommendation => {
      let finalScore = recommendation.score;

      // Priority boost
      switch (recommendation.priority) {
        case 'urgent':
          finalScore += 15;
          break;
        case 'high':
          finalScore += 10;
          break;
        case 'medium':
          finalScore += 5;
          break;
        case 'low':
          finalScore += 0;
          break;
      }

      // Ensure score stays within bounds
      finalScore = Math.max(0, Math.min(100, finalScore));

      return {
        ...recommendation,
        score: finalScore,
      };
    });
  }

  /**
   * Persist recommendations to database
   */
  private async persistRecommendations(
    recommendations: RecommendationResult[], 
    context: GeneratorContext
  ): Promise<void> {
    for (const recommendation of recommendations) {
      try {
        await db.transaction(async (tx) => {
          // Insert or update recommendation
          // Handle NULL values to match the database constraint's COALESCE logic
          const dedupHash = this.utils.generateDedupHash(recommendation);
          const designerId = recommendation.metadata?.designerId || null;
          const targetListId = recommendation.metadata?.targetListId || null;
          const groupKey = recommendation.groupKey || '';
          
          // Try to insert new recommendation, ignore conflicts
          const insertResult = await tx
            .insert(inboxRecommendations)
            .values({
              workspaceId: context.workspaceId,
              userId: context.userId,
              recommendationType: recommendation.type as any,
              title: recommendation.title,
              description: recommendation.description,
              score: recommendation.score,
              priority: recommendation.priority,
              status: 'new' as any,
              designerId: designerId,
              targetListId: targetListId,
              groupKey: groupKey,
              dedupHash: dedupHash,
              metadata: recommendation.metadata,
              expiresAt: recommendation.expiresAt,
            })
            .onConflictDoNothing()
            .returning();
          
          let savedRecommendation;
          
          if (insertResult.length > 0) {
            // New recommendation was inserted
            savedRecommendation = insertResult[0];
            console.log(`Inserted new recommendation with ID: ${savedRecommendation.id}`);
          } else {
            // Conflict occurred, find existing recommendation and update it
            const existing = await tx.query.inboxRecommendations.findFirst({
              where: and(
                eq(inboxRecommendations.workspaceId, context.workspaceId),
                eq(inboxRecommendations.recommendationType, recommendation.type as any),
                designerId ? eq(inboxRecommendations.designerId, designerId) : isNull(inboxRecommendations.designerId),
                targetListId ? eq(inboxRecommendations.targetListId, targetListId) : isNull(inboxRecommendations.targetListId),
                eq(inboxRecommendations.groupKey, groupKey),
                eq(inboxRecommendations.dedupHash, dedupHash)
              ),
            });
            
            if (existing) {
              console.log(`Found existing recommendation with ID: ${existing.id}, updating...`);
              // Update existing recommendation
              const updateResult = await tx
                .update(inboxRecommendations)
                .set({
                  score: recommendation.score,
                  priority: recommendation.priority,
                  status: 'new' as any,
                  metadata: recommendation.metadata,
                  updatedAt: new Date(),
                })
                .where(eq(inboxRecommendations.id, existing.id))
                .returning();
              
              if (updateResult.length > 0) {
                savedRecommendation = updateResult[0];
                console.log(`Updated recommendation with ID: ${savedRecommendation.id}`);
              } else {
                // Fallback to use the existing record if update doesn't return anything
                savedRecommendation = existing;
                console.log(`Using existing recommendation with ID: ${savedRecommendation.id}`);
              }
            } else {
              // This should not happen, but fallback to basic insert without constraint handling
              console.warn('Failed to find existing recommendation after conflict, skipping...');
              return; // Skip this recommendation
            }
          }

          // Validate that we have a valid recommendation with ID before proceeding
          if (!savedRecommendation || !savedRecommendation.id) {
            console.error('Critical error: savedRecommendation is null or missing ID', {
              savedRecommendation,
              recommendationType: recommendation.type,
              workspaceId: context.workspaceId,
              userId: context.userId
            });
            throw new Error('Failed to get valid recommendation ID for database operations');
          }

          // Insert candidates
          for (const candidate of recommendation.candidates) {
            await tx
              .insert(inboxRecommendationCandidates)
              .values({
                recommendationId: savedRecommendation.id,
                designerId: candidate.designerId,
                score: candidate.score,
                rank: candidate.rank,
                reasoning: candidate.reasoning,
                metadata: candidate.metadata,
              })
              .onConflictDoNothing();
          }

          // Log creation event
          await tx.insert(inboxRecommendationEvents).values({
            recommendationId: savedRecommendation.id,
            userId: context.userId,
            eventType: 'created',
            description: `Recommendation created by ${recommendation.type} generator`,
            metadata: {
              generatorType: recommendation.type,
              score: recommendation.score,
              candidateCount: recommendation.candidates.length,
            },
          });
        });
      } catch (error) {
        console.error(`Error persisting recommendation:`, error);
        // Continue with other recommendations
      }
    }
  }

  /**
   * Get saved recommendations from database
   */
  async getSavedRecommendations(request: RecommendationRequest): Promise<RecommendationResult[]> {
    const whereConditions = [
      eq(inboxRecommendations.workspaceId, request.workspaceId),
      eq(inboxRecommendations.status, 'new' as any),
    ];

    if (request.types && request.types.length > 0) {
      whereConditions.push(
        inArray(inboxRecommendations.recommendationType, request.types as any[])
      );
    }

    const savedRecommendations = await db.query.inboxRecommendations.findMany({
      where: and(...whereConditions),
      with: {
        candidates: {
          orderBy: [inboxRecommendationCandidates.rank],
        },
      },
      orderBy: [desc(inboxRecommendations.score), desc(inboxRecommendations.createdAt)],
      limit: request.limit || 50,
    });

    return savedRecommendations.map(rec => ({
      id: rec.id,
      type: rec.recommendationType,
      title: rec.title,
      description: rec.description || '',
      score: rec.score || 0,
      priority: rec.priority || 'medium',
      reasoning: [], // Would need to be reconstructed from metadata
      metadata: rec.metadata || {},
      groupKey: rec.groupKey || undefined,
      expiresAt: rec.expiresAt || undefined,
      candidates: rec.candidates.map(candidate => ({
        designerId: candidate.designerId,
        score: candidate.score || 0,
        rank: candidate.rank || 0,
        reasoning: candidate.reasoning || '',
        metadata: candidate.metadata || {},
      })),
    }));
  }
}

// Export singleton instance
export const recommendationEngine = new RecommendationEngine();