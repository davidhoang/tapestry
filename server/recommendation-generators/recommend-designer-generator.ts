import OpenAI from "openai";
import { db } from "@db";
import { designers, jobs } from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { 
  RecommendationGenerator, 
  GeneratorContext 
} from "../recommendation-engine";
import { 
  RecommendationResult, 
  RecommendationCandidate
} from "../recommendation-utils";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface DesignerMatch {
  designer: any;
  job: any;
  matchScore: number;
  aiReasoning: string;
}

export class RecommendDesignerGenerator implements RecommendationGenerator {
  
  getType(): string {
    return 'recommend_designer';
  }

  async isEnabled(context: GeneratorContext): Promise<boolean> {
    const activeJobsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(and(
        eq(jobs.workspaceId, context.workspaceId),
        eq(jobs.status, 'active')
      ));

    return activeJobsCount[0]?.count > 0;
  }

  async generate(context: GeneratorContext): Promise<RecommendationResult[]> {
    const recommendations: RecommendationResult[] = [];

    const activeJobs = await db.query.jobs.findMany({
      where: and(
        eq(jobs.workspaceId, context.workspaceId),
        eq(jobs.status, 'active')
      ),
      orderBy: desc(jobs.createdAt),
    });

    if (activeJobs.length === 0) {
      return [];
    }

    const allDesigners = await db.query.designers.findMany({
      where: eq(designers.workspaceId, context.workspaceId),
      orderBy: desc(designers.createdAt),
    });

    if (allDesigners.length === 0) {
      return [];
    }

    for (const job of activeJobs) {
      try {
        const matches = await this.scoreDesignersForJob(job, allDesigners, context);
        
        for (const match of matches) {
          const recommendation = this.createRecommendation(match, context);
          recommendations.push(recommendation);
        }
      } catch (error) {
        console.error(`Error scoring designers for job ${job.id}:`, error);
      }
    }

    return recommendations.slice(0, 20);
  }

  private async scoreDesignersForJob(
    job: any,
    allDesigners: any[],
    context: GeneratorContext
  ): Promise<DesignerMatch[]> {
    const matches: DesignerMatch[] = [];
    const designersToScore = allDesigners.slice(0, 10);

    for (const designer of designersToScore) {
      try {
        const result = await this.scoreDesignerWithAI(designer, job);
        if (result.matchScore >= 50) {
          matches.push({
            designer,
            job,
            matchScore: result.matchScore,
            aiReasoning: result.reasoning,
          });
        }
      } catch (error) {
        console.error(`Error scoring designer ${designer.id} for job ${job.id}:`, error);
        const fallbackScore = context.utils.scoreDesigner(designer, {
          requiredSkills: this.extractSkillsFromJobDescription(job.description),
        });
        
        if (fallbackScore >= 50) {
          matches.push({
            designer,
            job,
            matchScore: fallbackScore,
            aiReasoning: 'Skills and experience match the job requirements.',
          });
        }
      }
    }

    return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
  }

  private async scoreDesignerWithAI(
    designer: any,
    job: any
  ): Promise<{ matchScore: number; reasoning: string }> {
    const prompt = `Evaluate how well this designer matches the job requirements.

Job Title: ${job.title}
Job Description: ${job.description}

Designer Profile:
- Name: ${designer.name}
- Title: ${designer.title || 'Not specified'}
- Level: ${designer.level || 'Not specified'}
- Skills: ${(designer.skills || []).join(', ') || 'Not specified'}
- Location: ${designer.location || 'Not specified'}
- Available: ${designer.available ? 'Yes' : 'No'}
- Description: ${designer.description || 'Not specified'}

Respond in JSON format:
{
  "matchScore": <number 0-100>,
  "reasoning": "<brief explanation of why this designer is or isn't a good match>"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a recruiting assistant that evaluates candidate-job fit. Be objective and provide a match score from 0-100 along with brief reasoning.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const result = JSON.parse(content);

    return {
      matchScore: Math.max(0, Math.min(100, result.matchScore || 0)),
      reasoning: result.reasoning || 'Unable to determine match reasoning.',
    };
  }

  private extractSkillsFromJobDescription(description: string): string[] {
    const commonSkills = [
      'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator',
      'react', 'vue', 'angular', 'javascript', 'typescript',
      'html', 'css', 'sass', 'tailwind', 'ui', 'ux', 'design',
      'prototyping', 'wireframing', 'user research', 'product design'
    ];

    const lowerDescription = description.toLowerCase();
    return commonSkills.filter(skill => lowerDescription.includes(skill));
  }

  private createRecommendation(match: DesignerMatch, context: GeneratorContext): RecommendationResult {
    const priority = match.matchScore > 80 ? 'high' : match.matchScore > 60 ? 'medium' : 'low';

    const candidate: RecommendationCandidate = {
      designerId: match.designer.id,
      score: match.matchScore,
      rank: 1,
      reasoning: match.aiReasoning,
      metadata: {
        jobId: match.job.id,
        jobTitle: match.job.title,
        confidence: match.matchScore,
      },
    };

    return {
      id: 0,
      type: 'recommend_designer',
      title: `Recommended: ${match.designer.name} for ${match.job.title}`,
      description: match.aiReasoning,
      score: match.matchScore,
      priority,
      candidates: [candidate],
      reasoning: [
        `Match score: ${match.matchScore}%`,
        `Designer skills: ${(match.designer.skills || []).slice(0, 5).join(', ')}`,
        match.designer.available ? 'Currently available for work' : 'May not be immediately available',
      ],
      metadata: {
        jobId: match.job.id,
        jobTitle: match.job.title,
        matchScore: match.matchScore,
        aiReasoning: match.aiReasoning,
        designerId: match.designer.id,
        designerName: match.designer.name,
        actionUrl: `/designers/${match.designer.id}`,
      },
      groupKey: `recommend_designer_${match.job.id}_${match.designer.id}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }
}
