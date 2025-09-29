import crypto from "crypto";

export interface RecommendationResult {
  id: number;
  type: string;
  title: string;
  description: string;
  score: number;
  priority: string;
  candidates: RecommendationCandidate[];
  reasoning: string[];
  metadata: Record<string, any>;
  groupKey?: string;
  expiresAt?: Date;
}

export interface RecommendationCandidate {
  designerId: number;
  score: number;
  rank: number;
  reasoning: string;
  metadata: Record<string, any>;
}

export interface FeedbackPattern {
  feedbackType: string;
  count: number;
  avgMatchScore: number;
  avgRating: number;
}

export interface FeedbackPatterns {
  byType: FeedbackPattern[];
  commonConcerns: string[];
  successFactors: string[];
  overallSuccessRate: number;
}

/**
 * Shared utilities for recommendation engine
 */
export class RecommendationUtils {
  
  /**
   * Generate a composite hash for deduplication
   */
  generateDedupHash(recommendation: RecommendationResult): string {
    // Create a normalized representation for deduplication
    const dedupKey = {
      type: recommendation.type,
      // For add_to_list recommendations, use target list + designer combinations
      designerIds: recommendation.candidates
        .slice(0, 5) // Top 5 candidates for consistency
        .map(c => c.designerId)
        .sort(),
      // Include key metadata for uniqueness
      listId: recommendation.metadata?.listId,
      skillRequirements: JSON.stringify(recommendation.metadata?.skillRequirements || []),
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(dedupKey))
      .digest('hex')
      .substring(0, 16); // Use first 16 characters
  }

  /**
   * Extract features from a designer for scoring
   */
  extractDesignerFeatures(designer: any): Record<string, any> {
    return {
      skills: designer.skills || [],
      level: designer.level,
      location: designer.location,
      company: designer.company,
      available: designer.available,
      hasWebsite: !!designer.website,
      hasLinkedIn: !!designer.linkedIn,
      hasPhoto: !!designer.photoUrl,
      hasDescription: !!designer.description,
      skillCount: (designer.skills || []).length,
      profileCompleteness: this.calculateProfileCompleteness(designer),
    };
  }

  /**
   * Calculate profile completeness score (0-100)
   */
  calculateProfileCompleteness(designer: any): number {
    const fields = [
      'name', 'title', 'location', 'company', 'level', 
      'website', 'linkedIn', 'email', 'photoUrl', 'description'
    ];
    
    const skillsWeight = 20; // Skills are heavily weighted
    const otherWeight = 80 / fields.length; // Distribute remaining weight

    let score = 0;
    
    // Check basic fields
    for (const field of fields) {
      if (designer[field] && designer[field].toString().trim().length > 0) {
        score += otherWeight;
      }
    }

    // Add skills weight
    const skills = designer.skills || [];
    if (skills.length > 0) {
      score += Math.min(skillsWeight, skills.length * (skillsWeight / 5)); // Max at 5 skills
    }

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Calculate skill match score between designer and requirements
   */
  calculateSkillMatch(designerSkills: string[], requiredSkills: string[]): number {
    if (!designerSkills || !requiredSkills || requiredSkills.length === 0) {
      return 0;
    }

    // Handle case where skills might be stored as different types
    const skillsArray = Array.isArray(designerSkills) ? designerSkills : [];
    const reqSkillsArray = Array.isArray(requiredSkills) ? requiredSkills : [];

    if (skillsArray.length === 0 || reqSkillsArray.length === 0) {
      return 0;
    }

    const normalizedDesignerSkills = skillsArray.map(s => String(s).toLowerCase().trim());
    const normalizedRequiredSkills = reqSkillsArray.map(s => String(s).toLowerCase().trim());

    let exactMatches = 0;
    let partialMatches = 0;

    for (const required of normalizedRequiredSkills) {
      if (normalizedDesignerSkills.includes(required)) {
        exactMatches++;
      } else {
        // Check for partial matches (e.g., "React" matches "React.js")
        const partialMatch = normalizedDesignerSkills.some(skill => 
          skill.includes(required) || required.includes(skill)
        );
        if (partialMatch) {
          partialMatches++;
        }
      }
    }

    // Calculate weighted score
    const exactWeight = 1.0;
    const partialWeight = 0.6;
    const totalScore = (exactMatches * exactWeight) + (partialMatches * partialWeight);
    
    return Math.min(100, Math.round((totalScore / requiredSkills.length) * 100));
  }

  /**
   * Score a designer for a specific context
   */
  scoreDesigner(
    designer: any, 
    context: {
      requiredSkills?: string[];
      preferredLevel?: string;
      locationPreference?: string;
      availabilityRequired?: boolean;
    }
  ): number {
    let score = 0;
    const weights = {
      skills: 40,
      level: 20,
      location: 15,
      availability: 15,
      profileCompleteness: 10,
    };

    // Skills match (most important)
    if (context.requiredSkills) {
      const skillScore = this.calculateSkillMatch(designer.skills, context.requiredSkills);
      score += (skillScore / 100) * weights.skills;
    } else {
      // If no specific skills required, reward diverse skill set
      score += Math.min(weights.skills, (designer.skills?.length || 0) * 5);
    }

    // Level match
    if (context.preferredLevel && designer.level) {
      const levelScore = this.calculateLevelMatch(designer.level, context.preferredLevel);
      score += (levelScore / 100) * weights.level;
    } else {
      score += weights.level * 0.7; // Neutral score if no preference
    }

    // Location match
    if (context.locationPreference && designer.location) {
      const locationScore = this.calculateLocationMatch(designer.location, context.locationPreference);
      score += (locationScore / 100) * weights.location;
    } else {
      score += weights.location * 0.8; // Slight penalty for missing location
    }

    // Availability
    if (context.availabilityRequired) {
      score += designer.available ? weights.availability : 0;
    } else {
      score += weights.availability * 0.9; // Slight preference for available
    }

    // Profile completeness
    const completeness = this.calculateProfileCompleteness(designer);
    score += (completeness / 100) * weights.profileCompleteness;

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Calculate level match score
   */
  private calculateLevelMatch(designerLevel: string, preferredLevel: string): number {
    const levels = ['intern', 'junior', 'mid', 'senior', 'lead', 'principal'];
    
    const designerIndex = levels.indexOf(designerLevel.toLowerCase());
    const preferredIndex = levels.indexOf(preferredLevel.toLowerCase());
    
    if (designerIndex === -1 || preferredIndex === -1) {
      return 50; // Neutral score for unknown levels
    }
    
    if (designerIndex === preferredIndex) {
      return 100; // Perfect match
    }
    
    // Penalize based on distance
    const distance = Math.abs(designerIndex - preferredIndex);
    return Math.max(0, 100 - (distance * 20));
  }

  /**
   * Calculate location match score
   */
  private calculateLocationMatch(designerLocation: string, preferredLocation: string): number {
    const normalized1 = designerLocation.toLowerCase().trim();
    const normalized2 = preferredLocation.toLowerCase().trim();
    
    if (normalized1 === normalized2) {
      return 100;
    }
    
    // Check for city/state/country matches
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      return 80;
    }
    
    // Check for common remote indicators
    const remoteKeywords = ['remote', 'anywhere', 'global', 'worldwide'];
    const isRemote1 = remoteKeywords.some(keyword => normalized1.includes(keyword));
    const isRemote2 = remoteKeywords.some(keyword => normalized2.includes(keyword));
    
    if (isRemote1 || isRemote2) {
      return 90;
    }
    
    return 30; // Different location penalty
  }

  /**
   * Generate rationale for a recommendation
   */
  generateRationale(
    recommendation: RecommendationResult,
    context: Record<string, any>
  ): string[] {
    const rationale: string[] = [];
    
    // Add type-specific rationale
    switch (recommendation.type) {
      case 'add_to_list':
        rationale.push(
          `Found ${recommendation.candidates.length} designers matching the list criteria`,
          `Top candidate has ${recommendation.candidates[0]?.score || 0}% compatibility`,
          `Average skill match across candidates: ${this.calculateAverageScore(recommendation.candidates)}%`
        );
        break;
        
      case 'create_list':
        rationale.push(
          `Identified ${recommendation.metadata?.designerCount || 0} designers with similar skills`,
          `Common skill pattern: ${recommendation.metadata?.commonSkills?.join(', ') || 'Various'}`,
          `Potential for ${recommendation.metadata?.estimatedValue || 'significant'} value`
        );
        break;
        
      case 'update_profile':
        rationale.push(
          `Profile completeness: ${recommendation.metadata?.completeness || 0}%`,
          `Missing ${recommendation.metadata?.missingFields?.length || 0} key fields`,
          `Profile last updated ${recommendation.metadata?.daysSinceUpdate || 'unknown'} days ago`
        );
        break;
    }
    
    return rationale.slice(0, 3); // Top 3 reasons
  }

  /**
   * Calculate average score across candidates
   */
  private calculateAverageScore(candidates: RecommendationCandidate[]): number {
    if (candidates.length === 0) return 0;
    
    const sum = candidates.reduce((acc, candidate) => acc + candidate.score, 0);
    return Math.round(sum / candidates.length);
  }

  /**
   * Analyze feedback patterns for RLHF learning
   */
  analyzeFeedbackPatterns(feedbackData: any[]): FeedbackPatterns {
    const byType: FeedbackPattern[] = [];
    const feedbackTypes = ['good_match', 'irrelevant_experience', 'under_qualified', 'over_qualified', 'location_mismatch'];
    
    for (const type of feedbackTypes) {
      const typeFeedback = feedbackData.filter(f => f.feedbackType === type);
      
      if (typeFeedback.length > 0) {
        byType.push({
          feedbackType: type,
          count: typeFeedback.length,
          avgMatchScore: typeFeedback.reduce((sum, f) => sum + f.matchScore, 0) / typeFeedback.length,
          avgRating: typeFeedback
            .filter(f => f.rating !== null)
            .reduce((sum, f) => sum + (f.rating || 0), 0) / Math.max(1, typeFeedback.filter(f => f.rating !== null).length),
        });
      }
    }

    // Extract common concerns from comments
    const comments = feedbackData
      .filter(f => f.comments && f.comments.trim().length > 0)
      .map(f => f.comments.toLowerCase());

    const concernKeywords = this.extractCommonKeywords(comments);
    
    // Calculate overall success rate
    const positiveCount = feedbackData.filter(f => 
      f.feedbackType === 'good_match' || (f.rating && f.rating >= 4)
    ).length;
    
    const overallSuccessRate = feedbackData.length > 0 
      ? Math.round((positiveCount / feedbackData.length) * 100) 
      : 0;

    return {
      byType,
      commonConcerns: concernKeywords.slice(0, 10),
      successFactors: this.extractSuccessFactors(feedbackData),
      overallSuccessRate,
    };
  }

  /**
   * Apply feedback learning to adjust recommendation score
   */
  applyFeedbackLearning(
    recommendation: RecommendationResult,
    patterns: FeedbackPatterns
  ): number {
    let adjustedScore = recommendation.score;
    
    // Apply type-specific adjustments based on feedback patterns
    const typePattern = patterns.byType.find(p => 
      this.getRecommendationFeedbackType(recommendation) === p.feedbackType
    );
    
    if (typePattern) {
      // Adjust based on historical success rate
      const successRate = typePattern.avgRating / 5; // Normalize to 0-1
      if (successRate > 0.7) {
        adjustedScore += 5; // Boost for historically successful patterns
      } else if (successRate < 0.4) {
        adjustedScore -= 10; // Penalize for historically poor patterns
      }
    }

    // Apply general learning from overall success rate
    if (patterns.overallSuccessRate > 80) {
      adjustedScore += 2; // Small boost for high-performing workspaces
    } else if (patterns.overallSuccessRate < 40) {
      adjustedScore -= 3; // Small penalty for low-performing workspaces
    }

    return adjustedScore;
  }

  /**
   * Map recommendation characteristics to potential feedback type
   */
  private getRecommendationFeedbackType(recommendation: RecommendationResult): string {
    // This is a simplified mapping - in practice, this would be more sophisticated
    if (recommendation.type === 'add_to_list' && recommendation.score > 80) {
      return 'good_match';
    }
    
    return 'good_match'; // Default optimistic assumption
  }

  /**
   * Extract common keywords from feedback comments
   */
  private extractCommonKeywords(comments: string[]): string[] {
    const wordCount = new Map<string, number>();
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
    
    for (const comment of comments) {
      const words = comment.match(/\b\w+\b/g) || [];
      
      for (const word of words) {
        if (word.length > 3 && !stopWords.has(word)) {
          wordCount.set(word, (wordCount.get(word) || 0) + 1);
        }
      }
    }
    
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Extract success factors from positive feedback
   */
  private extractSuccessFactors(feedbackData: any[]): string[] {
    const positiveFeedback = feedbackData.filter(f => 
      f.feedbackType === 'good_match' || (f.rating && f.rating >= 4)
    );
    
    const comments = positiveFeedback
      .filter(f => f.comments && f.comments.trim().length > 0)
      .map(f => f.comments.toLowerCase());
    
    return this.extractCommonKeywords(comments).slice(0, 5);
  }
}