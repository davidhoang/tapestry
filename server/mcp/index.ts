#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";
// Use relative imports for standalone execution outside Replit
import { db } from "../../db/index.js";
import { designers, lists, listDesigners, workspaces, apiTokens, designerEvents } from "../../db/schema.js";
import { eq, and, desc, or, ilike } from "drizzle-orm";
import { sql } from "drizzle-orm";
import crypto from "crypto";

interface AuthContext {
  userId: number;
  workspaceId: number;
  workspaceName: string;
  workspaceSlug: string;
  role: string;
  userEmail: string;
}

// Store the raw token for re-validation on each request (security: prevents revoked tokens from continuing to work)
let cachedToken: string | null = null;

async function validateToken(token: string): Promise<AuthContext | null> {
  if (!token || !token.startsWith('tap_')) {
    return null;
  }
  
  const rawToken = token.substring(4);
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  
  const tokenRecord = await db.query.apiTokens.findFirst({
    where: eq(apiTokens.tokenHash, tokenHash),
    with: {
      user: true,
      workspace: true,
    }
  });
  
  if (!tokenRecord) {
    return null;
  }
  
  if (tokenRecord.expiresAt && new Date() > tokenRecord.expiresAt) {
    return null;
  }
  
  await db.update(apiTokens)
    .set({ 
      lastUsedAt: new Date(),
      usageCount: sql`COALESCE(${apiTokens.usageCount}, 0) + 1`
    })
    .where(eq(apiTokens.id, tokenRecord.id));
  
  return {
    userId: tokenRecord.userId,
    workspaceId: tokenRecord.workspaceId,
    workspaceName: tokenRecord.workspace.name,
    workspaceSlug: tokenRecord.workspace.slug,
    role: tokenRecord.role,
    userEmail: tokenRecord.user.email,
  };
}

const TOOLS = [
  {
    name: "authenticate",
    description: "Authenticate with your Tapestry API token. Required before using other tools.",
    inputSchema: {
      type: "object" as const,
      properties: {
        token: { type: "string", description: "Your Tapestry API token (starts with tap_)" }
      },
      required: ["token"]
    }
  },
  {
    name: "search_designers",
    description: "Search for designers in your Tapestry workspace by name, title, skills, or location",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search term to match against name, title, or skills" },
        skill: { type: "string", description: "Filter by specific skill" },
        location: { type: "string", description: "Filter by location" },
        limit: { type: "number", description: "Maximum number of results (default 20)" }
      }
    }
  },
  {
    name: "get_designer",
    description: "Get detailed information about a specific designer by ID",
    inputSchema: {
      type: "object" as const,
      properties: {
        designerId: { type: "number", description: "The designer ID" }
      },
      required: ["designerId"]
    }
  },
  {
    name: "create_designer",
    description: "Create a new designer profile in your Tapestry workspace",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Designer's full name" },
        title: { type: "string", description: "Job title" },
        level: { type: "string", description: "Experience level (e.g., 'Senior', 'Lead', 'Principal')" },
        skills: { type: "array", items: { type: "string" }, description: "List of skills" },
        location: { type: "string", description: "Location" },
        company: { type: "string", description: "Current company" },
        email: { type: "string", description: "Email address" },
        linkedIn: { type: "string", description: "LinkedIn URL" },
        website: { type: "string", description: "Portfolio website URL" },
        description: { type: "string", description: "Bio or description" },
        notes: { type: "string", description: "Private notes about this designer" }
      },
      required: ["name", "title", "level", "skills"]
    }
  },
  {
    name: "update_designer",
    description: "Update an existing designer's profile",
    inputSchema: {
      type: "object" as const,
      properties: {
        designerId: { type: "number", description: "The designer ID to update" },
        name: { type: "string", description: "Designer's full name" },
        title: { type: "string", description: "Job title" },
        level: { type: "string", description: "Experience level" },
        skills: { type: "array", items: { type: "string" }, description: "List of skills" },
        location: { type: "string", description: "Location" },
        company: { type: "string", description: "Current company" },
        email: { type: "string", description: "Email address" },
        linkedIn: { type: "string", description: "LinkedIn URL" },
        website: { type: "string", description: "Portfolio website URL" },
        description: { type: "string", description: "Bio or description" },
        notes: { type: "string", description: "Private notes" },
        available: { type: "boolean", description: "Availability status" }
      },
      required: ["designerId"]
    }
  },
  {
    name: "list_lists",
    description: "Get all designer lists in your workspace",
    inputSchema: {
      type: "object" as const,
      properties: {}
    }
  },
  {
    name: "get_list_designers",
    description: "Get all designers in a specific list",
    inputSchema: {
      type: "object" as const,
      properties: {
        listId: { type: "number", description: "The list ID" }
      },
      required: ["listId"]
    }
  },
  {
    name: "create_list",
    description: "Create a new designer list",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "List name" },
        description: { type: "string", description: "List description" },
        isPublic: { type: "boolean", description: "Whether the list is publicly shareable" }
      },
      required: ["name"]
    }
  },
  {
    name: "add_designer_to_list",
    description: "Add a designer to a list",
    inputSchema: {
      type: "object" as const,
      properties: {
        listId: { type: "number", description: "The list ID" },
        designerId: { type: "number", description: "The designer ID to add" },
        notes: { type: "string", description: "Notes about why this designer is on this list" }
      },
      required: ["listId", "designerId"]
    }
  },
  {
    name: "remove_designer_from_list",
    description: "Remove a designer from a list",
    inputSchema: {
      type: "object" as const,
      properties: {
        listId: { type: "number", description: "The list ID" },
        designerId: { type: "number", description: "The designer ID to remove" }
      },
      required: ["listId", "designerId"]
    }
  },
  {
    name: "workspace_info",
    description: "Get information about your current workspace context",
    inputSchema: {
      type: "object" as const,
      properties: {}
    }
  },
  {
    name: "enrich_designer",
    description: "Enrich a designer's profile using AI to find publicly available information about them. This will search for the designer and return suggested enrichments.",
    inputSchema: {
      type: "object" as const,
      properties: {
        designerId: { type: "number", description: "The designer ID to enrich" }
      },
      required: ["designerId"]
    }
  },
  {
    name: "enrich_designer_from_url",
    description: "Enrich a designer's profile by extracting information from a URL (LinkedIn profile, portfolio website, Dribbble, Behance, etc.)",
    inputSchema: {
      type: "object" as const,
      properties: {
        designerId: { type: "number", description: "The designer ID to enrich" },
        url: { type: "string", description: "URL to extract information from (LinkedIn, portfolio site, Dribbble, Behance, etc.)" }
      },
      required: ["designerId", "url"]
    }
  },
  {
    name: "apply_enrichment",
    description: "Apply enrichment suggestions to a designer's profile. Use after enrich_designer or enrich_designer_from_url to apply the suggested changes.",
    inputSchema: {
      type: "object" as const,
      properties: {
        designerId: { type: "number", description: "The designer ID to update" },
        email: { type: "string", description: "Email address to set" },
        phoneNumber: { type: "string", description: "Phone number to set" },
        location: { type: "string", description: "Location to set" },
        company: { type: "string", description: "Company to set" },
        title: { type: "string", description: "Title to set" },
        linkedIn: { type: "string", description: "LinkedIn URL to set" },
        website: { type: "string", description: "Website URL to set" },
        skills: { type: "array", items: { type: "string" }, description: "Skills to add (will merge with existing)" },
        bio: { type: "string", description: "Bio/description to set" }
      },
      required: ["designerId"]
    }
  },
  {
    name: "bulk_enrich_designers",
    description: "Enrich multiple designers at once. Returns enrichment suggestions for each designer.",
    inputSchema: {
      type: "object" as const,
      properties: {
        designerIds: { type: "array", items: { type: "number" }, description: "Array of designer IDs to enrich" }
      },
      required: ["designerIds"]
    }
  }
];

async function handleToolCall(name: string, args: Record<string, unknown>): Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }> {
  
  if (name === "authenticate") {
    const token = args.token as string;
    const ctx = await validateToken(token);
    
    if (!ctx) {
      return {
        content: [{ type: "text", text: "Authentication failed. Please check your API token." }],
        isError: true
      };
    }
    
    // Store the raw token for re-validation on subsequent requests
    cachedToken = token;
    
    return {
      content: [{ 
        type: "text", 
        text: `Successfully authenticated as ${ctx.userEmail} in workspace "${ctx.workspaceName}" (${ctx.workspaceSlug}) with role: ${ctx.role}` 
      }]
    };
  }
  
  // Re-validate token on EVERY request to ensure revoked/expired tokens are rejected
  // and role changes take effect immediately (security: prevents revocation bypass)
  if (!cachedToken) {
    return {
      content: [{ type: "text", text: "Please authenticate first using the authenticate tool with your API token." }],
      isError: true
    };
  }
  
  const authContext = await validateToken(cachedToken);
  if (!authContext) {
    cachedToken = null; // Clear invalid token
    return {
      content: [{ type: "text", text: "Your authentication has expired or been revoked. Please authenticate again." }],
      isError: true
    };
  }
  
  switch (name) {
    case "search_designers": {
      const { query, skill, location, limit } = args as { query?: string; skill?: string; location?: string; limit?: number };
      
      let whereConditions: any[] = [eq(designers.workspaceId, authContext.workspaceId)];
      
      if (query) {
        whereConditions.push(
          or(
            ilike(designers.name, `%${query}%`),
            ilike(designers.title, `%${query}%`),
            sql`${designers.skills}::text ILIKE ${'%' + query + '%'}`
          )
        );
      }
      
      if (location) {
        whereConditions.push(ilike(designers.location, `%${location}%`));
      }
      
      let results = await db.query.designers.findMany({
        where: and(...whereConditions),
        limit: Math.min(limit || 20, 50),
        orderBy: desc(designers.createdAt),
      });
      
      if (skill) {
        results = results.filter(d => 
          d.skills?.some((s: string) => s.toLowerCase().includes(skill.toLowerCase()))
        );
      }
      
      const formatted = results.map(d => 
        `- **${d.name}** (ID: ${d.id})\n  Title: ${d.title}\n  Location: ${d.location || 'N/A'}\n  Skills: ${d.skills?.join(', ') || 'N/A'}`
      ).join('\n\n');
      
      return {
        content: [{ 
          type: "text", 
          text: results.length > 0 
            ? `Found ${results.length} designer(s):\n\n${formatted}`
            : "No designers found matching your criteria."
        }]
      };
    }
    
    case "get_designer": {
      const { designerId } = args as { designerId: number };
      
      const designer = await db.query.designers.findFirst({
        where: and(
          eq(designers.id, designerId),
          eq(designers.workspaceId, authContext.workspaceId)
        )
      });
      
      if (!designer) {
        return {
          content: [{ type: "text", text: `Designer with ID ${designerId} not found in your workspace.` }],
          isError: true
        };
      }
      
      const designerLists = await db.query.listDesigners.findMany({
        where: eq(listDesigners.designerId, designerId),
        with: { list: true }
      });
      
      const listNames = designerLists.map(ld => ld.list?.name).filter(Boolean);
      
      const details = `
**${designer.name}** (ID: ${designer.id})

**Title:** ${designer.title}
**Company:** ${designer.company || 'N/A'}
**Location:** ${designer.location || 'N/A'}
**Level:** ${designer.level}
**Email:** ${designer.email || 'N/A'}
**Available:** ${designer.available ? 'Yes' : 'No'}

**Skills:** ${designer.skills?.join(', ') || 'N/A'}

**Bio/Description:** ${designer.description || 'N/A'}

**Notes:** ${designer.notes || 'N/A'}

**Portfolio:** ${designer.website || 'N/A'}
**LinkedIn:** ${designer.linkedIn || 'N/A'}

**In Lists:** ${listNames.length > 0 ? listNames.join(', ') : 'None'}

**Added:** ${designer.createdAt?.toISOString() || 'N/A'}
      `.trim();
      
      return { content: [{ type: "text", text: details }] };
    }
    
    case "create_designer": {
      const params = args as { name: string; title: string; level: string; skills: string[]; location?: string; company?: string; email?: string; linkedIn?: string; website?: string; description?: string; notes?: string };
      
      if (!['owner', 'admin', 'editor'].includes(authContext.role)) {
        return {
          content: [{ type: "text", text: "You don't have permission to create designers. Required role: editor, admin, or owner." }],
          isError: true
        };
      }
      
      const [newDesigner] = await db.insert(designers).values({
        workspaceId: authContext.workspaceId,
        userId: authContext.userId,
        name: params.name,
        title: params.title,
        level: params.level,
        skills: params.skills,
        location: params.location || null,
        company: params.company || null,
        email: params.email || null,
        linkedIn: params.linkedIn || null,
        website: params.website || null,
        description: params.description || null,
        notes: params.notes || null,
        available: false,
      }).returning();
      
      return {
        content: [{ type: "text", text: `Successfully created designer "${newDesigner.name}" with ID: ${newDesigner.id}` }]
      };
    }
    
    case "update_designer": {
      const { designerId, ...updates } = args as { designerId: number; [key: string]: unknown };
      
      if (!['owner', 'admin', 'editor'].includes(authContext.role)) {
        return {
          content: [{ type: "text", text: "You don't have permission to update designers." }],
          isError: true
        };
      }
      
      const existing = await db.query.designers.findFirst({
        where: and(
          eq(designers.id, designerId),
          eq(designers.workspaceId, authContext.workspaceId)
        )
      });
      
      if (!existing) {
        return {
          content: [{ type: "text", text: `Designer with ID ${designerId} not found in your workspace.` }],
          isError: true
        };
      }
      
      const updateData: any = {};
      const allowedFields = ['name', 'title', 'level', 'skills', 'location', 'company', 'email', 'linkedIn', 'website', 'description', 'notes', 'available'];
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      }
      
      if (Object.keys(updateData).length === 0) {
        return {
          content: [{ type: "text", text: "No updates provided." }],
          isError: true
        };
      }
      
      const [updated] = await db.update(designers)
        .set(updateData)
        .where(eq(designers.id, designerId))
        .returning();
      
      return {
        content: [{ type: "text", text: `Successfully updated designer "${updated.name}" (ID: ${updated.id})` }]
      };
    }
    
    case "list_lists": {
      const allLists = await db.query.lists.findMany({
        where: eq(lists.workspaceId, authContext.workspaceId),
        orderBy: desc(lists.createdAt),
      });
      
      if (allLists.length === 0) {
        return { content: [{ type: "text", text: "No lists found in your workspace." }] };
      }
      
      const listCounts = await Promise.all(
        allLists.map(async (list) => {
          const count = await db.query.listDesigners.findMany({
            where: eq(listDesigners.listId, list.id)
          });
          return { ...list, designerCount: count.length };
        })
      );
      
      const formatted = listCounts.map(l => 
        `- **${l.name}** (ID: ${l.id})\n  Description: ${l.description || 'N/A'}\n  Designers: ${l.designerCount}\n  Public: ${l.isPublic ? 'Yes' : 'No'}`
      ).join('\n\n');
      
      return { content: [{ type: "text", text: `Found ${allLists.length} list(s):\n\n${formatted}` }] };
    }
    
    case "get_list_designers": {
      const { listId } = args as { listId: number };
      
      const list = await db.query.lists.findFirst({
        where: and(
          eq(lists.id, listId),
          eq(lists.workspaceId, authContext.workspaceId)
        )
      });
      
      if (!list) {
        return {
          content: [{ type: "text", text: `List with ID ${listId} not found in your workspace.` }],
          isError: true
        };
      }
      
      const listEntries = await db.query.listDesigners.findMany({
        where: eq(listDesigners.listId, listId),
        with: { designer: true }
      });
      
      if (listEntries.length === 0) {
        return { content: [{ type: "text", text: `List "${list.name}" has no designers.` }] };
      }
      
      const formatted = listEntries.map(entry => {
        const d = entry.designer;
        return `- **${d?.name}** (ID: ${d?.id})\n  Title: ${d?.title}\n  Skills: ${d?.skills?.join(', ') || 'N/A'}`;
      }).join('\n\n');
      
      return { content: [{ type: "text", text: `List "${list.name}" has ${listEntries.length} designer(s):\n\n${formatted}` }] };
    }
    
    case "create_list": {
      const { name, description, isPublic } = args as { name: string; description?: string; isPublic?: boolean };
      
      if (!['owner', 'admin', 'editor'].includes(authContext.role)) {
        return {
          content: [{ type: "text", text: "You don't have permission to create lists." }],
          isError: true
        };
      }
      
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const uniqueSlug = `${slug}-${Date.now().toString(36)}`;
      
      const [newList] = await db.insert(lists).values({
        workspaceId: authContext.workspaceId,
        userId: authContext.userId,
        name,
        description: description || null,
        slug: uniqueSlug,
        isPublic: isPublic || false,
      }).returning();
      
      return { content: [{ type: "text", text: `Successfully created list "${newList.name}" with ID: ${newList.id}` }] };
    }
    
    case "add_designer_to_list": {
      const { listId, designerId, notes } = args as { listId: number; designerId: number; notes?: string };
      
      if (!['owner', 'admin', 'editor'].includes(authContext.role)) {
        return {
          content: [{ type: "text", text: "You don't have permission to modify lists." }],
          isError: true
        };
      }
      
      const [list, designer] = await Promise.all([
        db.query.lists.findFirst({
          where: and(eq(lists.id, listId), eq(lists.workspaceId, authContext.workspaceId))
        }),
        db.query.designers.findFirst({
          where: and(eq(designers.id, designerId), eq(designers.workspaceId, authContext.workspaceId))
        })
      ]);
      
      if (!list) {
        return { content: [{ type: "text", text: `List with ID ${listId} not found.` }], isError: true };
      }
      
      if (!designer) {
        return { content: [{ type: "text", text: `Designer with ID ${designerId} not found.` }], isError: true };
      }
      
      const existing = await db.query.listDesigners.findFirst({
        where: and(eq(listDesigners.listId, listId), eq(listDesigners.designerId, designerId))
      });
      
      if (existing) {
        return { content: [{ type: "text", text: `Designer "${designer.name}" is already in list "${list.name}".` }] };
      }
      
      await db.insert(listDesigners).values({ listId, designerId, notes: notes || null });
      
      return { content: [{ type: "text", text: `Successfully added "${designer.name}" to list "${list.name}"` }] };
    }
    
    case "remove_designer_from_list": {
      const { listId, designerId } = args as { listId: number; designerId: number };
      
      if (!['owner', 'admin', 'editor'].includes(authContext.role)) {
        return {
          content: [{ type: "text", text: "You don't have permission to modify lists." }],
          isError: true
        };
      }
      
      const entry = await db.query.listDesigners.findFirst({
        where: and(eq(listDesigners.listId, listId), eq(listDesigners.designerId, designerId)),
        with: { list: true, designer: true }
      });
      
      if (!entry || entry.list?.workspaceId !== authContext.workspaceId) {
        return { content: [{ type: "text", text: "Designer is not in this list or list not found." }], isError: true };
      }
      
      await db.delete(listDesigners).where(eq(listDesigners.id, entry.id));
      
      return { content: [{ type: "text", text: `Successfully removed "${entry.designer?.name}" from list "${entry.list?.name}"` }] };
    }
    
    case "workspace_info": {
      const [designerCount, listCount] = await Promise.all([
        db.query.designers.findMany({ where: eq(designers.workspaceId, authContext.workspaceId) }),
        db.query.lists.findMany({ where: eq(lists.workspaceId, authContext.workspaceId) })
      ]);
      
      return {
        content: [{
          type: "text",
          text: `
**Workspace:** ${authContext.workspaceName}
**Slug:** ${authContext.workspaceSlug}
**Your Role:** ${authContext.role}
**Your Email:** ${authContext.userEmail}

**Statistics:**
- Total Designers: ${designerCount.length}
- Total Lists: ${listCount.length}
          `.trim()
        }]
      };
    }
    
    case "enrich_designer": {
      const { designerId } = args as { designerId: number };
      
      if (!['owner', 'admin', 'editor'].includes(authContext.role)) {
        return {
          content: [{ type: "text", text: "You don't have permission to enrich designers." }],
          isError: true
        };
      }
      
      const designer = await db.query.designers.findFirst({
        where: and(
          eq(designers.id, designerId),
          eq(designers.workspaceId, authContext.workspaceId)
        )
      });
      
      if (!designer) {
        return {
          content: [{ type: "text", text: `Designer with ID ${designerId} not found in your workspace.` }],
          isError: true
        };
      }
      
      const { enrichDesignerProfile } = await import('../enrichment.js');
      
      try {
        const enrichmentResult = await enrichDesignerProfile(designer.name, {
          title: designer.title || undefined,
          company: designer.company || undefined,
          email: designer.email || undefined,
          skills: designer.skills || undefined,
        });
        
        if (!enrichmentResult.success) {
          return {
            content: [{ type: "text", text: `Failed to enrich designer: ${enrichmentResult.error || 'Unknown error'}` }],
            isError: true
          };
        }
        
        const suggestions = enrichmentResult.data;
        const formatted = `
**Enrichment Suggestions for ${designer.name}** (ID: ${designerId})

**Current Profile:**
- Title: ${designer.title || 'N/A'}
- Company: ${designer.company || 'N/A'}
- Location: ${designer.location || 'N/A'}
- Email: ${designer.email || 'N/A'}

**Suggested Updates:**
- Name: ${suggestions?.name || 'N/A'}
- Title: ${suggestions?.title || 'N/A'}
- Company: ${suggestions?.company || 'N/A'}
- Location: ${suggestions?.location || 'N/A'}
- Email: ${suggestions?.email || 'N/A'}
- Bio: ${suggestions?.bio ? suggestions.bio.substring(0, 200) + '...' : 'N/A'}
- Skills: ${suggestions?.skills?.join(', ') || 'N/A'}
- Portfolio: ${suggestions?.portfolioUrl || 'N/A'}
- LinkedIn: ${suggestions?.socialLinks?.linkedin || 'N/A'}
- Twitter: ${suggestions?.socialLinks?.twitter || 'N/A'}
- Dribbble: ${suggestions?.socialLinks?.dribbble || 'N/A'}

**Confidence:** ${((enrichmentResult.confidence || 0) * 100).toFixed(0)}%

Use the \`apply_enrichment\` tool to apply these suggestions to the designer's profile.
        `.trim();
        
        return { content: [{ type: "text", text: formatted }] };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error enriching designer: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true
        };
      }
    }
    
    case "enrich_designer_from_url": {
      const { designerId, url } = args as { designerId: number; url: string };
      
      if (!['owner', 'admin', 'editor'].includes(authContext.role)) {
        return {
          content: [{ type: "text", text: "You don't have permission to enrich designers." }],
          isError: true
        };
      }
      
      const designer = await db.query.designers.findFirst({
        where: and(
          eq(designers.id, designerId),
          eq(designers.workspaceId, authContext.workspaceId)
        )
      });
      
      if (!designer) {
        return {
          content: [{ type: "text", text: `Designer with ID ${designerId} not found in your workspace.` }],
          isError: true
        };
      }
      
      const { enrichFromUrl } = await import('../enrichment.js');
      
      try {
        const enrichmentResult = await enrichFromUrl(url, designer.name);
        
        if (!enrichmentResult.success) {
          return {
            content: [{ type: "text", text: `Failed to enrich from URL: ${enrichmentResult.error || 'Unknown error'}` }],
            isError: true
          };
        }
        
        const suggestions = enrichmentResult.data;
        const confidence = enrichmentResult.confidence || 0;
        const hasWarning = enrichmentResult.error && enrichmentResult.success;
        
        const formatted = `
**Enrichment from URL for ${designer.name}** (ID: ${designerId})

**Source URL:** ${url}
${hasWarning ? `\n**Warning:** ${enrichmentResult.error}\n` : ''}
**Extracted Information:**
- Name: ${suggestions?.name || 'N/A'}
- Title: ${suggestions?.title || 'N/A'}
- Company: ${suggestions?.company || 'N/A'}
- Location: ${suggestions?.location || 'N/A'}
- Email: ${suggestions?.email || 'N/A'}
- Bio: ${suggestions?.bio ? suggestions.bio.substring(0, 200) + '...' : 'N/A'}
- Skills: ${suggestions?.skills?.join(', ') || 'N/A'}
- Portfolio: ${suggestions?.portfolioUrl || 'N/A'}
- LinkedIn: ${suggestions?.socialLinks?.linkedin || 'N/A'}

**Confidence:** ${(confidence * 100).toFixed(0)}%${confidence < 0.5 ? ' (low - page content could not be fetched)' : ''}

${confidence >= 0.5 ? 'Use the `apply_enrichment` tool to apply these suggestions to the designer\'s profile.' : 'Only URL metadata was extracted. Consider manually reviewing the profile or providing a different URL.'}
        `.trim();
        
        return { content: [{ type: "text", text: formatted }] };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error enriching from URL: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true
        };
      }
    }
    
    case "apply_enrichment": {
      const { designerId, ...updates } = args as { 
        designerId: number; 
        email?: string;
        phoneNumber?: string;
        location?: string;
        company?: string;
        title?: string;
        linkedIn?: string;
        website?: string;
        skills?: string[];
        bio?: string;
      };
      
      if (!['owner', 'admin', 'editor'].includes(authContext.role)) {
        return {
          content: [{ type: "text", text: "You don't have permission to update designers." }],
          isError: true
        };
      }
      
      const designer = await db.query.designers.findFirst({
        where: and(
          eq(designers.id, designerId),
          eq(designers.workspaceId, authContext.workspaceId)
        )
      });
      
      if (!designer) {
        return {
          content: [{ type: "text", text: `Designer with ID ${designerId} not found in your workspace.` }],
          isError: true
        };
      }
      
      const updateData: any = {
        enrichedAt: new Date(),
        enrichmentSource: 'mcp'
      };
      
      const appliedFields: string[] = [];
      
      if (updates.email) { updateData.email = updates.email; appliedFields.push('email'); }
      if (updates.phoneNumber) { updateData.phoneNumber = updates.phoneNumber; appliedFields.push('phone'); }
      if (updates.location) { updateData.location = updates.location; appliedFields.push('location'); }
      if (updates.company) { updateData.company = updates.company; appliedFields.push('company'); }
      if (updates.title) { updateData.title = updates.title; appliedFields.push('title'); }
      if (updates.linkedIn) { updateData.linkedIn = updates.linkedIn; appliedFields.push('linkedIn'); }
      if (updates.website) { updateData.website = updates.website; appliedFields.push('website'); }
      if (updates.bio) { updateData.description = updates.bio; appliedFields.push('bio'); }
      if (updates.skills && Array.isArray(updates.skills)) {
        const existingSkills = designer.skills || [];
        const skillSet = new Set([...existingSkills, ...updates.skills]);
        updateData.skills = Array.from(skillSet);
        appliedFields.push('skills');
      }
      
      if (appliedFields.length === 0) {
        return {
          content: [{ type: "text", text: "No fields to update. Provide at least one field to apply." }],
          isError: true
        };
      }
      
      const [updated] = await db.update(designers)
        .set(updateData)
        .where(eq(designers.id, designerId))
        .returning();
      
      await db.insert(designerEvents).values({
        workspaceId: authContext.workspaceId,
        designerId: designerId,
        eventType: 'enrichment_applied',
        source: 'mcp',
        actorUserId: authContext.userId,
        summary: `Profile enriched via MCP: ${appliedFields.join(', ')}`,
        details: {
          changedFields: appliedFields,
          previousValues: {
            email: designer.email,
            phoneNumber: designer.phoneNumber,
            location: designer.location,
            company: designer.company,
            title: designer.title,
            linkedIn: designer.linkedIn,
            website: designer.website,
            skills: designer.skills,
          },
          newValues: updates,
          enrichmentSource: 'mcp',
        },
      });
      
      return {
        content: [{ 
          type: "text", 
          text: `Successfully applied enrichment to "${updated.name}" (ID: ${updated.id})\n\n**Updated fields:** ${appliedFields.join(', ')}`
        }]
      };
    }
    
    case "bulk_enrich_designers": {
      const { designerIds } = args as { designerIds: number[] };
      
      if (!['owner', 'admin', 'editor'].includes(authContext.role)) {
        return {
          content: [{ type: "text", text: "You don't have permission to enrich designers." }],
          isError: true
        };
      }
      
      if (!designerIds || designerIds.length === 0) {
        return {
          content: [{ type: "text", text: "Please provide at least one designer ID to enrich." }],
          isError: true
        };
      }
      
      if (designerIds.length > 10) {
        return {
          content: [{ type: "text", text: "Maximum 10 designers can be enriched at once to avoid rate limits." }],
          isError: true
        };
      }
      
      const { enrichDesignerProfile } = await import('../enrichment.js');
      
      const results: string[] = [];
      
      for (const designerId of designerIds) {
        const designer = await db.query.designers.findFirst({
          where: and(
            eq(designers.id, designerId),
            eq(designers.workspaceId, authContext.workspaceId)
          )
        });
        
        if (!designer) {
          results.push(`- **ID ${designerId}**: Not found in workspace`);
          continue;
        }
        
        try {
          const enrichmentResult = await enrichDesignerProfile(designer.name, {
            title: designer.title || undefined,
            company: designer.company || undefined,
            email: designer.email || undefined,
          });
          
          if (enrichmentResult.success && enrichmentResult.data) {
            const data = enrichmentResult.data;
            const newFields: string[] = [];
            if (data.title && !designer.title) newFields.push('title');
            if (data.company && !designer.company) newFields.push('company');
            if (data.email && !designer.email) newFields.push('email');
            if (data.location && !designer.location) newFields.push('location');
            if (data.skills && data.skills.length > 0) newFields.push(`${data.skills.length} skills`);
            
            results.push(`- **${designer.name}** (ID: ${designerId}): Found ${newFields.length > 0 ? newFields.join(', ') : 'enrichment data'} - ${((enrichmentResult.confidence || 0) * 100).toFixed(0)}% confidence`);
          } else {
            results.push(`- **${designer.name}** (ID: ${designerId}): No enrichment data found`);
          }
        } catch (error) {
          results.push(`- **${designer.name}** (ID: ${designerId}): Error - ${error instanceof Error ? error.message : 'Unknown'}`);
        }
      }
      
      return {
        content: [{
          type: "text",
          text: `**Bulk Enrichment Results**\n\nProcessed ${designerIds.length} designer(s):\n\n${results.join('\n')}\n\nUse \`enrich_designer\` on individual designers to see full suggestions, then \`apply_enrichment\` to apply them.`
        }]
      };
    }
    
    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
  }
}

const server = new Server(
  { name: "tapestry-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const { name, arguments: args } = request.params;
  return handleToolCall(name, args || {});
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Tapestry MCP server running...");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
