import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PEOPLE_DATA_LABS_API_KEY = process.env.PEOPLE_DATA_LABS_API_KEY;
const PDL_API_URL = 'https://api.peopledatalabs.com/v5/person/enrich';

export interface DesignerEnrichmentData {
  name: string;
  title?: string;
  company?: string;
  bio?: string;
  experience?: string;
  skills?: string[];
  portfolioUrl?: string;
  email?: string;
  phone?: string;
  location?: string;
  availability?: string;
  rate?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    dribbble?: string;
    behance?: string;
    github?: string;
  };
  additionalInfo?: string;
}

export interface EnrichmentResult {
  success: boolean;
  data?: DesignerEnrichmentData;
  confidence: number;
  sources?: string[];
  error?: string;
}

export async function enrichDesignerProfile(
  name: string,
  existingData?: Partial<DesignerEnrichmentData>
): Promise<EnrichmentResult> {
  try {
    const prompt = `You are a professional researcher specializing in finding information about designers and creative professionals. 

Given the designer name "${name}"${existingData ? ` and existing information: ${JSON.stringify(existingData, null, 2)}` : ''}, please research and provide comprehensive professional information.

Search for publicly available information about this person including:
- Professional title and current role
- Company/workplace
- Professional bio
- Years of experience and career highlights
- Technical skills (design tools, programming languages, etc.)
- Portfolio website or professional website
- Location (city, country)
- Professional social media profiles (LinkedIn, Twitter, Dribbble, Behance, GitHub)
- Contact information if publicly available
- Any notable projects, awards, or achievements

Please provide factual, up-to-date information only. If information cannot be verified or found, mark fields as null rather than guessing.

Respond with JSON in this exact format:
{
  "name": "Full professional name",
  "title": "Current job title or null",
  "company": "Current company or null", 
  "bio": "Professional bio/summary or null",
  "experience": "Years of experience and key highlights or null",
  "skills": ["array", "of", "skills"] or null,
  "portfolioUrl": "Portfolio website URL or null",
  "email": "Professional email or null",
  "phone": "Phone number or null", 
  "location": "City, Country or null",
  "availability": "Availability status or null",
  "rate": "Hourly/project rate or null",
  "socialLinks": {
    "linkedin": "LinkedIn URL or null",
    "twitter": "Twitter URL or null", 
    "dribbble": "Dribbble URL or null",
    "behance": "Behance URL or null",
    "github": "GitHub URL or null"
  },
  "additionalInfo": "Any other relevant professional information or null",
  "confidence": 0.0-1.0,
  "sources": ["list", "of", "information", "sources"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional researcher. Provide only factual, publicly available information. Never fabricate or guess information. If you cannot find verified information, return null for that field."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1 // Low temperature for factual accuracy
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Validate and clean the response
    const cleanedData: DesignerEnrichmentData = {
      name: result.name || name,
      title: result.title || undefined,
      company: result.company || undefined,
      bio: result.bio || undefined,
      experience: result.experience || undefined,
      skills: Array.isArray(result.skills) ? result.skills : undefined,
      portfolioUrl: result.portfolioUrl || undefined,
      email: result.email || undefined,
      phone: result.phone || undefined,
      location: result.location || undefined,
      availability: result.availability || undefined,
      rate: result.rate || undefined,
      socialLinks: result.socialLinks || undefined,
      additionalInfo: result.additionalInfo || undefined
    };

    return {
      success: true,
      data: cleanedData,
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      sources: Array.isArray(result.sources) ? result.sources : []
    };

  } catch (error) {
    console.error('Designer enrichment error:', error);
    return {
      success: false,
      confidence: 0,
      error: error instanceof Error ? error.message : 'Failed to enrich profile'
    };
  }
}

export async function generateDesignerSkills(bio: string, experience: string): Promise<string[]> {
  try {
    const prompt = `Based on the following designer's bio and experience, extract and suggest relevant professional skills. Focus on design tools, methodologies, and technical skills.

Bio: ${bio}
Experience: ${experience}

Return a JSON array of skills, focusing on:
- Design software (Figma, Sketch, Adobe Creative Suite, etc.)
- Design methodologies (User Research, Design Systems, etc.)
- Technical skills (HTML/CSS, React, etc.)
- Specialized areas (Mobile Design, Web Design, Brand Design, etc.)

Example: ["UI Design", "Figma", "User Research", "Design Systems", "React"]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content || '{"skills": []}');
    return Array.isArray(result.skills) ? result.skills : [];

  } catch (error) {
    console.error('Skills generation error:', error);
    return [];
  }
}

export interface PDLEnrichmentData {
  email?: string;
  phoneNumber?: string;
  location?: string;
  company?: string;
  title?: string;
  linkedin?: string;
  website?: string;
  skills?: string[];
}

export interface PDLEnrichmentResult {
  success: boolean;
  data?: PDLEnrichmentData;
  error?: string;
  likelihood?: number;
}

export async function enrichFromUrl(
  url: string,
  designerName?: string
): Promise<EnrichmentResult> {
  try {
    // First, attempt to fetch the actual page content
    let pageContent = '';
    let fetchSucceeded = false;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TapestryBot/1.0; +https://tapestry.design)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const html = await response.text();
        // Extract text content, removing scripts and styles
        pageContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 15000); // Limit content size for API
        fetchSucceeded = true;
      }
    } catch (fetchError) {
      console.log('Could not fetch URL directly, will analyze URL pattern:', fetchError);
      // Continue with URL-based analysis if fetch fails (common for LinkedIn, etc.)
    }

    const prompt = fetchSucceeded
      ? `You are a professional researcher specializing in extracting information about designers and creative professionals.

I have fetched the content from "${url}"${designerName ? ` for a designer named "${designerName}"` : ''}. Please extract professional information from this page content.

PAGE CONTENT:
${pageContent}

Extract the following information if available:
- Full name
- Professional title and current role
- Company/workplace
- Professional bio
- Skills and expertise
- Location
- Contact information
- Social media profiles

Only extract information that is ACTUALLY PRESENT in the content above. Do not guess or fabricate information.`
      : `You are a professional researcher. The URL "${url}"${designerName ? ` for "${designerName}"` : ''} could not be fetched directly (this is common for LinkedIn and some portfolio sites that block bots).

Based ONLY on the URL structure, identify:
1. What type of profile this is (LinkedIn, Dribbble, Behance, GitHub, personal portfolio, etc.)
2. Any username or identifier visible in the URL

DO NOT fabricate profile details. Only report what can be definitively determined from the URL itself.`;

    const systemPrompt = fetchSucceeded
      ? "You are a professional researcher. Extract only information that is explicitly present in the provided page content. Never fabricate or guess information. If information is not clearly stated, return null for that field."
      : "You are a professional researcher. Since the page content could not be fetched, only report URL metadata (type of site, username from URL). Set all profile fields to null since they cannot be verified without fetching the page.";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt + `

Respond with JSON in this exact format:
{
  "name": "Full professional name or null",
  "title": "Current job title or null",
  "company": "Current company or null", 
  "bio": "Professional bio/summary or null",
  "experience": "Years of experience and key highlights or null",
  "skills": ["array", "of", "skills"] or null,
  "portfolioUrl": "Portfolio website URL or null",
  "email": "Professional email or null",
  "phone": "Phone number or null", 
  "location": "City, Country or null",
  "availability": "Availability status or null",
  "rate": "Hourly/project rate or null",
  "socialLinks": {
    "linkedin": "LinkedIn URL or null",
    "twitter": "Twitter URL or null", 
    "dribbble": "Dribbble URL or null",
    "behance": "Behance URL or null",
    "github": "GitHub URL or null"
  },
  "additionalInfo": "Any other relevant professional information or null",
  "confidence": 0.0-1.0,
  "sources": ["source description"],
  "fetchedContent": ${fetchSucceeded}
}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // If we couldn't fetch the content, return limited info with low confidence
    if (!fetchSucceeded) {
      return {
        success: true,
        data: {
          name: designerName || '',
          socialLinks: {
            linkedin: url.includes('linkedin') ? url : undefined,
            dribbble: url.includes('dribbble') ? url : undefined,
            behance: url.includes('behance') ? url : undefined,
            github: url.includes('github') ? url : undefined,
          },
          portfolioUrl: !url.includes('linkedin') && !url.includes('dribbble') && !url.includes('behance') && !url.includes('github') ? url : undefined,
        },
        confidence: 0.2,
        sources: [url],
        error: 'Could not fetch page content. Only URL metadata extracted. The profile may require manual review.'
      };
    }
    
    const cleanedData: DesignerEnrichmentData = {
      name: result.name || designerName || '',
      title: result.title || undefined,
      company: result.company || undefined,
      bio: result.bio || undefined,
      experience: result.experience || undefined,
      skills: Array.isArray(result.skills) ? result.skills : undefined,
      portfolioUrl: result.portfolioUrl || (url.includes('linkedin') ? undefined : url),
      email: result.email || undefined,
      phone: result.phone || undefined,
      location: result.location || undefined,
      availability: result.availability || undefined,
      rate: result.rate || undefined,
      socialLinks: {
        linkedin: url.includes('linkedin') ? url : result.socialLinks?.linkedin,
        twitter: result.socialLinks?.twitter,
        dribbble: url.includes('dribbble') ? url : result.socialLinks?.dribbble,
        behance: url.includes('behance') ? url : result.socialLinks?.behance,
        github: url.includes('github') ? url : result.socialLinks?.github,
      },
      additionalInfo: result.additionalInfo || undefined
    };

    return {
      success: true,
      data: cleanedData,
      confidence: Math.max(0, Math.min(1, result.confidence || 0.7)),
      sources: [url]
    };

  } catch (error) {
    console.error('URL enrichment error:', error);
    return {
      success: false,
      confidence: 0,
      error: error instanceof Error ? error.message : 'Failed to enrich from URL'
    };
  }
}

export async function enrichWithPeopleDataLabs(params: {
  name?: string;
  email?: string;
  linkedin?: string;
  company?: string;
}): Promise<PDLEnrichmentResult> {
  if (!PEOPLE_DATA_LABS_API_KEY) {
    return {
      success: false,
      error: 'People Data Labs API key not configured'
    };
  }

  try {
    const queryParams = new URLSearchParams();
    
    if (params.name) queryParams.append('name', params.name);
    if (params.email) queryParams.append('email', params.email);
    if (params.linkedin) queryParams.append('profile', params.linkedin);
    if (params.company) queryParams.append('company', params.company);
    
    queryParams.append('pretty', 'true');

    const response = await fetch(`${PDL_API_URL}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': PEOPLE_DATA_LABS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PDL API error:', response.status, errorText);
      return {
        success: false,
        error: `API request failed: ${response.status}`
      };
    }

    const result = await response.json();

    if (result.status === 200 && result.data) {
      const person = result.data;
      
      const enrichmentData: PDLEnrichmentData = {
        email: person.work_email || person.emails?.[0]?.address,
        phoneNumber: person.phone_numbers?.[0],
        location: person.location_name || 
                 (person.location_locality && person.location_country 
                   ? `${person.location_locality}, ${person.location_country}` 
                   : undefined),
        company: person.job_company_name,
        title: person.job_title,
        linkedin: person.linkedin_url,
        website: person.personal_emails?.[0] ? undefined : person.websites?.[0],
        skills: person.skills?.map((s: any) => s.name).slice(0, 10)
      };

      return {
        success: true,
        data: enrichmentData,
        likelihood: result.likelihood || 0
      };
    }

    return {
      success: false,
      error: 'No data found for the provided information'
    };

  } catch (error) {
    console.error('People Data Labs enrichment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enrich profile'
    };
  }
}