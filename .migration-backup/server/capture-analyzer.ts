import OpenAI from "openai";
import { db } from "@db";
import { designers } from "@db/schema";
import { eq, ilike, or, and } from "drizzle-orm";
import type { SelectCaptureEntry, SelectCaptureAsset, SelectDesigner } from "@db/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ExtractedEntity {
  type: 'designer';
  name: string;
  title?: string;
  company?: string;
  skills?: string[];
  portfolioUrl?: string;
  linkedinUrl?: string;
  email?: string;
  location?: string;
  matchedDesignerId?: number;
  confidence: number;
  action: 'enrich_existing' | 'create_new' | 'add_to_list';
}

export interface CaptureAnalysisResult {
  entities: ExtractedEntity[];
  summary: string;
  rawInsights: string;
  extractedData: {
    names: Array<{ value: string; confidence: number }>;
    companies: Array<{ value: string; confidence: number }>;
    skills: Array<{ value: string; confidence: number }>;
    emails: string[];
    linkedinUrls: string[];
    portfolioUrls: string[];
    locations: string[];
    titles: string[];
  };
  suggestedActions: Array<{
    actionType: 'create_designer' | 'enrich_profile' | 'add_to_list';
    confidence: number;
    targetDesignerId?: number;
    targetListId?: number;
    reasoning: string;
    extractedData?: Record<string, any>;
  }>;
  processingModel: string;
  processingDuration: number;
}

async function findMatchingDesigner(
  workspaceId: number,
  name: string,
  email?: string,
  linkedinUrl?: string
): Promise<SelectDesigner | null> {
  const conditions: ReturnType<typeof eq>[] = [];
  
  if (email) {
    conditions.push(eq(designers.email, email.toLowerCase()));
  }
  
  if (linkedinUrl) {
    conditions.push(eq(designers.linkedIn, linkedinUrl));
  }
  
  if (name) {
    conditions.push(ilike(designers.name, `%${name}%`));
  }

  if (conditions.length === 0) {
    return null;
  }

  const matchingDesigner = await db.query.designers.findFirst({
    where: and(
      eq(designers.workspaceId, workspaceId),
      or(...conditions)
    ),
  });

  return matchingDesigner || null;
}

export async function analyzeCapture(
  entry: SelectCaptureEntry,
  assets: SelectCaptureAsset[],
  workspaceId: number
): Promise<CaptureAnalysisResult> {
  const startTime = Date.now();

  let contentToAnalyze = '';
  
  if (entry.contentRaw) {
    contentToAnalyze += entry.contentRaw;
  }

  for (const asset of assets) {
    if (asset.extractedText) {
      contentToAnalyze += '\n\n' + asset.extractedText;
    }
  }

  if (!contentToAnalyze.trim()) {
    return {
      entities: [],
      summary: 'No content to analyze',
      rawInsights: '',
      extractedData: {
        names: [],
        companies: [],
        skills: [],
        emails: [],
        linkedinUrls: [],
        portfolioUrls: [],
        locations: [],
        titles: [],
      },
      suggestedActions: [],
      processingModel: 'gpt-4o',
      processingDuration: Date.now() - startTime,
    };
  }

  const emailMetadata = entry.metadata as { emailFrom?: string; emailSubject?: string; emailTo?: string } | null;
  const contextInfo = emailMetadata?.emailFrom 
    ? `\n\nEmail context: From: ${emailMetadata.emailFrom}, Subject: ${emailMetadata.emailSubject || 'N/A'}`
    : '';

  const prompt = `You are an expert at extracting information about designers and creative professionals from text content. Analyze the following content and extract any mentions of designers, creative professionals, or design-related contacts.

Content to analyze:
${contentToAnalyze}${contextInfo}

Extract the following information for each person mentioned:
1. Full name
2. Professional title/role
3. Company/organization
4. Skills (design tools, methodologies, specializations)
5. Portfolio URL (if mentioned)
6. LinkedIn URL (if mentioned)
7. Email address (if mentioned)
8. Location (city, country if mentioned)

For each extracted entity, provide a confidence score (0.0 to 1.0) based on how certain you are about the extracted information.

Respond with a JSON object in this exact format:
{
  "entities": [
    {
      "type": "designer",
      "name": "Full Name",
      "title": "Job Title or null",
      "company": "Company Name or null",
      "skills": ["skill1", "skill2"] or [],
      "portfolioUrl": "URL or null",
      "linkedinUrl": "URL or null",
      "email": "email@example.com or null",
      "location": "City, Country or null",
      "confidence": 0.85
    }
  ],
  "extractedData": {
    "names": [{"value": "Name", "confidence": 0.9}],
    "companies": [{"value": "Company", "confidence": 0.8}],
    "skills": [{"value": "Skill", "confidence": 0.7}],
    "emails": ["email@example.com"],
    "linkedinUrls": ["https://linkedin.com/in/..."],
    "portfolioUrls": ["https://portfolio.com"],
    "locations": ["New York, USA"],
    "titles": ["Senior Designer"]
  },
  "summary": "Brief summary of what was found",
  "rawInsights": "Any additional context or insights about the content"
}

If no designers or creative professionals are mentioned, return empty arrays. Focus on accuracy over quantity - only extract information you're confident about.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert data extraction assistant specializing in identifying designers and creative professionals from text. Return only valid JSON without markdown code blocks."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    let cleanedResponse = aiResponse.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.slice(7);
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.slice(3);
    }
    if (cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.slice(0, -3);
    }
    cleanedResponse = cleanedResponse.trim();

    const parsed = JSON.parse(cleanedResponse);

    const entitiesWithMatches: ExtractedEntity[] = [];
    const suggestedActions: CaptureAnalysisResult['suggestedActions'] = [];

    for (const entity of parsed.entities || []) {
      const matchedDesigner = await findMatchingDesigner(
        workspaceId,
        entity.name,
        entity.email,
        entity.linkedinUrl
      );

      let action: ExtractedEntity['action'] = 'create_new';
      if (matchedDesigner) {
        action = 'enrich_existing';
      }

      entitiesWithMatches.push({
        type: 'designer',
        name: entity.name,
        title: entity.title || undefined,
        company: entity.company || undefined,
        skills: entity.skills || [],
        portfolioUrl: entity.portfolioUrl || undefined,
        linkedinUrl: entity.linkedinUrl || undefined,
        email: entity.email || undefined,
        location: entity.location || undefined,
        matchedDesignerId: matchedDesigner?.id,
        confidence: entity.confidence || 0.5,
        action,
      });

      if (matchedDesigner) {
        suggestedActions.push({
          actionType: 'enrich_profile',
          confidence: entity.confidence || 0.5,
          targetDesignerId: matchedDesigner.id,
          reasoning: `Found existing designer "${matchedDesigner.name}" matching "${entity.name}"`,
          extractedData: {
            name: entity.name,
            title: entity.title,
            company: entity.company,
            skills: entity.skills,
            portfolioUrl: entity.portfolioUrl,
            linkedinUrl: entity.linkedinUrl,
            email: entity.email,
            location: entity.location,
          },
        });
      } else {
        suggestedActions.push({
          actionType: 'create_designer',
          confidence: entity.confidence || 0.5,
          reasoning: `New designer profile for "${entity.name}"`,
          extractedData: {
            name: entity.name,
            title: entity.title,
            company: entity.company,
            skills: entity.skills,
            portfolioUrl: entity.portfolioUrl,
            linkedinUrl: entity.linkedinUrl,
            email: entity.email,
            location: entity.location,
          },
        });
      }
    }

    return {
      entities: entitiesWithMatches,
      summary: parsed.summary || `Found ${entitiesWithMatches.length} potential designer(s)`,
      rawInsights: parsed.rawInsights || '',
      extractedData: {
        names: parsed.extractedData?.names || [],
        companies: parsed.extractedData?.companies || [],
        skills: parsed.extractedData?.skills || [],
        emails: parsed.extractedData?.emails || [],
        linkedinUrls: parsed.extractedData?.linkedinUrls || [],
        portfolioUrls: parsed.extractedData?.portfolioUrls || [],
        locations: parsed.extractedData?.locations || [],
        titles: parsed.extractedData?.titles || [],
      },
      suggestedActions,
      processingModel: 'gpt-4o',
      processingDuration: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Capture analysis error:', error);
    throw error;
  }
}
