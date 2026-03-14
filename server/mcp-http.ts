import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Request, Response, Express } from "express";
import { db } from "@db";
import { designers, lists, listDesigners, workspaces, apiTokens, designerEvents } from "@db/schema";
import { eq, and, desc, or, ilike, sql } from "drizzle-orm";
import crypto from "crypto";

interface AuthContext {
  userId: number;
  workspaceId: number;
  workspaceName: string;
  workspaceSlug: string;
  role: string;
  userEmail: string;
}

interface SearchDesignersArgs {
  query?: string;
  skill?: string;
  location?: string;
  limit?: number;
  offset?: number;
}

interface QuickSearchArgs {
  query: string;
  limit?: number;
}

interface DesignerIdArgs {
  designerId: number;
}

interface GetDesignerTimelineArgs {
  designerId: number;
  limit?: number;
}

interface AddNoteArgs {
  designerId: number;
  content: string;
}

interface CreateDesignerArgs {
  name: string;
  title: string;
  level: string;
  skills: string[];
  location?: string;
  company?: string;
  email?: string;
  linkedIn?: string;
  website?: string;
  description?: string;
  notes?: string;
}

interface UpdateDesignerArgs {
  designerId: number;
  name?: string;
  title?: string;
  level?: string;
  skills?: string[];
  location?: string;
  company?: string;
  email?: string;
  linkedIn?: string;
  website?: string;
  description?: string;
  notes?: string;
  available?: boolean;
}

interface ListIdArgs {
  listId: number;
}

interface CreateListArgs {
  name: string;
  description?: string;
  isPublic?: boolean;
}

interface AddDesignerToListArgs {
  listId: number;
  designerId: number;
  notes?: string;
}

interface RemoveDesignerFromListArgs {
  listId: number;
  designerId: number;
}

interface EnrichDesignerFromUrlArgs {
  designerId: number;
  url: string;
}

interface ApplyEnrichmentArgs {
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
}

interface BulkEnrichDesignersArgs {
  designerIds: number[];
}

interface ToolResult {
  content: { type: "text"; text: string }[];
  isError?: boolean;
}

const WRITABLE_ROLES: readonly string[] = ['owner', 'admin', 'editor'];

function hasWriteAccess(role: string): boolean {
  return WRITABLE_ROLES.includes(role);
}

interface DesignerUpdateFields {
  name?: string;
  title?: string;
  level?: string;
  skills?: string[];
  location?: string;
  company?: string;
  email?: string;
  linkedIn?: string;
  website?: string;
  description?: string;
  notes?: string;
  available?: boolean;
  [key: string]: unknown;
}

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
    name: "search_designers",
    description: "Search for designers in your Tapestry workspace by name, title, skills, or location. Supports pagination for large result sets.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search term to match against name, title, or skills (case-insensitive)" },
        skill: { type: "string", description: "Filter by specific skill (case-insensitive partial match)" },
        location: { type: "string", description: "Filter by location (case-insensitive partial match)" },
        limit: { type: "number", description: "Maximum number of results (default 20, max 50)" },
        offset: { type: "number", description: "Number of results to skip for pagination (default 0)" }
      }
    }
  },
  {
    name: "quick_search",
    description: "Lightweight search returning only id, name, and title for faster responses. Ideal for autocomplete or quick lookups.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search term to match against name or title (case-insensitive)" },
        limit: { type: "number", description: "Maximum number of results (default 10, max 25)" }
      },
      required: ["query"]
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
    name: "get_designer_timeline",
    description: "Get timeline entries (events) for a specific designer, ordered by most recent first",
    inputSchema: {
      type: "object" as const,
      properties: {
        designerId: { type: "number", description: "The designer ID" },
        limit: { type: "number", description: "Maximum number of entries to return (default 20, max 100)" }
      },
      required: ["designerId"]
    }
  },
  {
    name: "add_note",
    description: "Add a note to a designer's timeline. Creates a timeline event with type 'note_added'.",
    inputSchema: {
      type: "object" as const,
      properties: {
        designerId: { type: "number", description: "The designer ID to add the note to" },
        content: { type: "string", description: "The note content/text" }
      },
      required: ["designerId", "content"]
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
    description: "Get information about the current authenticated workspace",
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
        designerIds: { type: "array", items: { type: "number" }, description: "Array of designer IDs to enrich (max 10)" }
      },
      required: ["designerIds"]
    }
  }
];

async function handleToolCall(name: string, args: Record<string, unknown>, authContext: AuthContext): Promise<ToolResult> {
  switch (name) {
    case "search_designers": {
      const { query, skill, location, limit = 20, offset = 0 } = args as SearchDesignersArgs;
      
      const conditions = [eq(designers.workspaceId, authContext.workspaceId)];
      
      if (query) {
        conditions.push(
          or(
            ilike(designers.name, `%${query}%`),
            ilike(designers.title, `%${query}%`),
            sql`${designers.skills}::text ILIKE ${'%' + query + '%'}`
          )!
        );
      }
      
      if (skill) {
        conditions.push(
          sql`${designers.skills}::text ILIKE ${'%' + skill + '%'}`
        );
      }
      
      if (location) {
        conditions.push(ilike(designers.location, `%${location}%`));
      }
      
      const whereClause = and(...conditions);
      const actualLimit = Math.min(limit, 50);
      const actualOffset = Math.max(0, offset);
      
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(designers)
        .where(whereClause);
      
      const total = Number(countResult?.count || 0);
      
      const results = await db.query.designers.findMany({
        where: whereClause,
        orderBy: desc(designers.createdAt),
        limit: actualLimit,
        offset: actualOffset,
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            results: results.map(d => ({
              id: d.id,
              name: d.name,
              title: d.title,
              company: d.company,
              location: d.location,
              skills: d.skills,
              email: d.email,
            })),
            total,
            count: results.length,
            offset: actualOffset,
            hasMore: actualOffset + results.length < total
          }, null, 2)
        }]
      };
    }

    case "quick_search": {
      const { query, limit = 10 } = args as QuickSearchArgs;
      
      if (!query || query.trim().length === 0) {
        return { 
          content: [{ 
            type: "text", 
            text: "Error: Query parameter is required and cannot be empty. Provide a search term to match against designer names or titles." 
          }] 
        };
      }
      
      const results = await db.query.designers.findMany({
        where: and(
          eq(designers.workspaceId, authContext.workspaceId),
          or(
            ilike(designers.name, `%${query}%`),
            ilike(designers.title, `%${query}%`)
          )
        ),
        columns: {
          id: true,
          name: true,
          title: true,
        },
        orderBy: desc(designers.createdAt),
        limit: Math.min(limit, 25),
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify(results, null, 2)
        }]
      };
    }

    case "get_designer": {
      const { designerId } = args as DesignerIdArgs;
      
      if (!designerId || typeof designerId !== 'number') {
        return { 
          content: [{ 
            type: "text", 
            text: "Error: designerId is required and must be a number. Use search_designers or quick_search to find designer IDs." 
          }] 
        };
      }
      
      const designer = await db.query.designers.findFirst({
        where: and(
          eq(designers.id, designerId),
          eq(designers.workspaceId, authContext.workspaceId)
        ),
      });

      if (!designer) {
        return { 
          content: [{ 
            type: "text", 
            text: `Error: Designer with ID ${designerId} not found in your workspace. The designer may have been deleted, or you may not have access to this designer. Use search_designers to find available designers.` 
          }] 
        };
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            id: designer.id,
            name: designer.name,
            title: designer.title,
            location: designer.location,
            company: designer.company,
            level: designer.level,
            website: designer.website,
            linkedIn: designer.linkedIn,
            email: designer.email,
            phoneNumber: designer.phoneNumber,
            photoUrl: designer.photoUrl,
            skills: designer.skills,
            available: designer.available,
            description: designer.description,
            notes: designer.notes,
            enrichedAt: designer.enrichedAt,
            enrichmentSource: designer.enrichmentSource,
            createdAt: designer.createdAt,
          }, null, 2)
        }]
      };
    }

    case "get_designer_timeline": {
      const { designerId, limit = 20 } = args as GetDesignerTimelineArgs;
      
      if (!designerId || typeof designerId !== 'number') {
        return { 
          content: [{ 
            type: "text", 
            text: "Error: designerId is required and must be a number. Use search_designers or quick_search to find designer IDs." 
          }] 
        };
      }
      
      const designer = await db.query.designers.findFirst({
        where: and(
          eq(designers.id, designerId),
          eq(designers.workspaceId, authContext.workspaceId)
        ),
        columns: { id: true }
      });

      if (!designer) {
        return { 
          content: [{ 
            type: "text", 
            text: `Error: Designer with ID ${designerId} not found in your workspace. The designer may have been deleted, or you may not have access to this designer.` 
          }] 
        };
      }
      
      const events = await db.query.designerEvents.findMany({
        where: and(
          eq(designerEvents.designerId, designerId),
          eq(designerEvents.workspaceId, authContext.workspaceId)
        ),
        orderBy: desc(designerEvents.createdAt),
        limit: Math.min(limit, 100),
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            designerId,
            events: events.map(e => ({
              id: e.id,
              eventType: e.eventType,
              source: e.source,
              summary: e.summary,
              details: e.details,
              createdAt: e.createdAt,
            })),
            count: events.length
          }, null, 2)
        }]
      };
    }

    case "add_note": {
      const { designerId, content } = args as AddNoteArgs;
      
      if (!designerId || typeof designerId !== 'number') {
        return { 
          content: [{ 
            type: "text", 
            text: "Error: designerId is required and must be a number. Use search_designers or quick_search to find designer IDs." 
          }] 
        };
      }
      
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return { 
          content: [{ 
            type: "text", 
            text: "Error: content is required and cannot be empty. Provide the note text you want to add to the designer's timeline." 
          }] 
        };
      }
      
      const designer = await db.query.designers.findFirst({
        where: and(
          eq(designers.id, designerId),
          eq(designers.workspaceId, authContext.workspaceId)
        ),
        columns: { id: true, name: true }
      });

      if (!designer) {
        return { 
          content: [{ 
            type: "text", 
            text: `Error: Designer with ID ${designerId} not found in your workspace. The designer may have been deleted, or you may not have access to this designer.` 
          }] 
        };
      }
      
      const [newEvent] = await db.insert(designerEvents).values({
        workspaceId: authContext.workspaceId,
        designerId: designerId,
        eventType: 'note_added',
        source: 'mcp',
        actorUserId: authContext.userId,
        summary: content.trim(),
        details: {
          addedVia: 'mcp_api',
          userEmail: authContext.userEmail
        }
      }).returning();

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            message: `Note added to ${designer.name}'s timeline`,
            event: {
              id: newEvent.id,
              eventType: newEvent.eventType,
              summary: newEvent.summary,
              createdAt: newEvent.createdAt
            }
          }, null, 2)
        }]
      };
    }

    case "create_designer": {
      const params = args as CreateDesignerArgs;
      
      if (!['owner', 'admin', 'editor'].includes(authContext.role)) {
        return {
          content: [{ type: "text", text: "Error: You don't have permission to create designers. Required role: editor, admin, or owner." }],
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
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            message: `Created designer "${newDesigner.name}"`,
            designer: {
              id: newDesigner.id,
              name: newDesigner.name,
              title: newDesigner.title,
              level: newDesigner.level,
              skills: newDesigner.skills,
            }
          }, null, 2)
        }]
      };
    }

    case "update_designer": {
      const { designerId, ...updates } = args as UpdateDesignerArgs;
      
      if (!['owner', 'admin', 'editor'].includes(authContext.role)) {
        return {
          content: [{ type: "text", text: "Error: You don't have permission to update designers. Required role: editor, admin, or owner." }],
          isError: true
        };
      }
      
      if (!designerId || typeof designerId !== 'number') {
        return {
          content: [{ type: "text", text: "Error: designerId is required and must be a number." }],
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
          content: [{ type: "text", text: `Error: Designer with ID ${designerId} not found in your workspace.` }],
          isError: true
        };
      }
      
      const updateData: DesignerUpdateFields = {};
      const allowedFields: (keyof DesignerUpdateFields)[] = ['name', 'title', 'level', 'skills', 'location', 'company', 'email', 'linkedIn', 'website', 'description', 'notes', 'available'];
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      }
      
      if (Object.keys(updateData).length === 0) {
        return {
          content: [{ type: "text", text: "Error: No updates provided. Specify at least one field to update." }],
          isError: true
        };
      }
      
      const [updated] = await db.update(designers)
        .set(updateData)
        .where(eq(designers.id, designerId))
        .returning();
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            message: `Updated designer "${updated.name}" (ID: ${updated.id})`,
            updatedFields: Object.keys(updateData)
          }, null, 2)
        }]
      };
    }

    case "list_lists": {
      const allLists = await db.query.lists.findMany({
        where: eq(lists.workspaceId, authContext.workspaceId),
        orderBy: desc(lists.createdAt),
      });

      if (allLists.length === 0) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              message: "No lists found in your workspace. Create a list in Tapestry to organize your designers.",
              lists: []
            }, null, 2)
          }]
        };
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify(allLists.map(l => ({
            id: l.id,
            name: l.name,
            description: l.description,
            isPublic: l.isPublic,
          })), null, 2)
        }]
      };
    }

    case "get_list_designers": {
      const { listId } = args as ListIdArgs;
      
      if (!listId || typeof listId !== 'number') {
        return {
          content: [{ type: "text", text: "Error: listId is required and must be a number." }],
          isError: true
        };
      }
      
      const list = await db.query.lists.findFirst({
        where: and(
          eq(lists.id, listId),
          eq(lists.workspaceId, authContext.workspaceId)
        )
      });
      
      if (!list) {
        return {
          content: [{ type: "text", text: `Error: List with ID ${listId} not found in your workspace.` }],
          isError: true
        };
      }
      
      const listEntries = await db.query.listDesigners.findMany({
        where: eq(listDesigners.listId, listId),
        with: { designer: true }
      });
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            list: { id: list.id, name: list.name },
            designers: listEntries.map(entry => ({
              id: entry.designer?.id,
              name: entry.designer?.name,
              title: entry.designer?.title,
              skills: entry.designer?.skills,
              notes: entry.notes,
            })),
            count: listEntries.length
          }, null, 2)
        }]
      };
    }

    case "create_list": {
      const { name, description, isPublic } = args as CreateListArgs;
      
      if (!['owner', 'admin', 'editor'].includes(authContext.role)) {
        return {
          content: [{ type: "text", text: "Error: You don't have permission to create lists. Required role: editor, admin, or owner." }],
          isError: true
        };
      }
      
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return {
          content: [{ type: "text", text: "Error: name is required and cannot be empty." }],
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
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            message: `Created list "${newList.name}"`,
            list: { id: newList.id, name: newList.name, slug: newList.slug }
          }, null, 2)
        }]
      };
    }

    case "add_designer_to_list": {
      const { listId, designerId, notes } = args as AddDesignerToListArgs;
      
      if (!['owner', 'admin', 'editor'].includes(authContext.role)) {
        return {
          content: [{ type: "text", text: "Error: You don't have permission to modify lists. Required role: editor, admin, or owner." }],
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
        return { content: [{ type: "text", text: `Error: List with ID ${listId} not found in your workspace.` }], isError: true };
      }
      
      if (!designer) {
        return { content: [{ type: "text", text: `Error: Designer with ID ${designerId} not found in your workspace.` }], isError: true };
      }
      
      const existing = await db.query.listDesigners.findFirst({
        where: and(eq(listDesigners.listId, listId), eq(listDesigners.designerId, designerId))
      });
      
      if (existing) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              message: `Designer "${designer.name}" is already in list "${list.name}".`
            }, null, 2)
          }]
        };
      }
      
      await db.insert(listDesigners).values({ listId, designerId, notes: notes || null });
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            message: `Added "${designer.name}" to list "${list.name}"`
          }, null, 2)
        }]
      };
    }

    case "remove_designer_from_list": {
      const { listId, designerId } = args as RemoveDesignerFromListArgs;
      
      if (!['owner', 'admin', 'editor'].includes(authContext.role)) {
        return {
          content: [{ type: "text", text: "Error: You don't have permission to modify lists. Required role: editor, admin, or owner." }],
          isError: true
        };
      }
      
      const entry = await db.query.listDesigners.findFirst({
        where: and(eq(listDesigners.listId, listId), eq(listDesigners.designerId, designerId)),
        with: { list: true, designer: true }
      });
      
      if (!entry || entry.list?.workspaceId !== authContext.workspaceId) {
        return { content: [{ type: "text", text: "Error: Designer is not in this list or list not found in your workspace." }], isError: true };
      }
      
      await db.delete(listDesigners).where(eq(listDesigners.id, entry.id));
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            message: `Removed "${entry.designer?.name}" from list "${entry.list?.name}"`
          }, null, 2)
        }]
      };
    }

    case "workspace_info": {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            name: authContext.workspaceName,
            slug: authContext.workspaceSlug,
            role: authContext.role,
            userEmail: authContext.userEmail,
          }, null, 2)
        }]
      };
    }

    case "enrich_designer": {
      const { designerId } = args as DesignerIdArgs;
      
      if (!['owner', 'admin', 'editor'].includes(authContext.role)) {
        return {
          content: [{ type: "text", text: "Error: You don't have permission to enrich designers. Required role: editor, admin, or owner." }],
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
          content: [{ type: "text", text: `Error: Designer with ID ${designerId} not found in your workspace.` }],
          isError: true
        };
      }
      
      const { enrichDesignerProfile } = await import('./enrichment.js');
      
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
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              designerId,
              designerName: designer.name,
              currentProfile: {
                title: designer.title,
                company: designer.company,
                location: designer.location,
                email: designer.email,
              },
              suggestions: {
                name: suggestions?.name,
                title: suggestions?.title,
                company: suggestions?.company,
                location: suggestions?.location,
                email: suggestions?.email,
                bio: suggestions?.bio,
                skills: suggestions?.skills,
                portfolioUrl: suggestions?.portfolioUrl,
                socialLinks: suggestions?.socialLinks,
              },
              confidence: enrichmentResult.confidence,
              hint: "Use the apply_enrichment tool to apply these suggestions to the designer's profile."
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error enriching designer: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true
        };
      }
    }

    case "enrich_designer_from_url": {
      const { designerId, url } = args as EnrichDesignerFromUrlArgs;
      
      if (!['owner', 'admin', 'editor'].includes(authContext.role)) {
        return {
          content: [{ type: "text", text: "Error: You don't have permission to enrich designers. Required role: editor, admin, or owner." }],
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
          content: [{ type: "text", text: `Error: Designer with ID ${designerId} not found in your workspace.` }],
          isError: true
        };
      }
      
      const { enrichFromUrl } = await import('./enrichment.js');
      
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
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              designerId,
              designerName: designer.name,
              sourceUrl: url,
              suggestions: {
                name: suggestions?.name,
                title: suggestions?.title,
                company: suggestions?.company,
                location: suggestions?.location,
                email: suggestions?.email,
                bio: suggestions?.bio,
                skills: suggestions?.skills,
                portfolioUrl: suggestions?.portfolioUrl,
                socialLinks: suggestions?.socialLinks,
              },
              confidence,
              warning: enrichmentResult.error && enrichmentResult.success ? enrichmentResult.error : undefined,
              hint: confidence >= 0.5
                ? "Use the apply_enrichment tool to apply these suggestions to the designer's profile."
                : "Low confidence - only URL metadata was extracted. Consider manually reviewing the profile or providing a different URL."
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error enriching from URL: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true
        };
      }
    }

    case "apply_enrichment": {
      const { designerId, ...updates } = args as ApplyEnrichmentArgs;
      
      if (!['owner', 'admin', 'editor'].includes(authContext.role)) {
        return {
          content: [{ type: "text", text: "Error: You don't have permission to update designers. Required role: editor, admin, or owner." }],
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
          content: [{ type: "text", text: `Error: Designer with ID ${designerId} not found in your workspace.` }],
          isError: true
        };
      }
      
      const updateData: Record<string, unknown> = {
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
          content: [{ type: "text", text: "Error: No fields to update. Provide at least one field to apply." }],
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
          text: JSON.stringify({
            success: true,
            message: `Applied enrichment to "${updated.name}" (ID: ${updated.id})`,
            updatedFields: appliedFields
          }, null, 2)
        }]
      };
    }

    case "bulk_enrich_designers": {
      const { designerIds } = args as BulkEnrichDesignersArgs;
      
      if (!['owner', 'admin', 'editor'].includes(authContext.role)) {
        return {
          content: [{ type: "text", text: "Error: You don't have permission to enrich designers. Required role: editor, admin, or owner." }],
          isError: true
        };
      }
      
      if (!designerIds || designerIds.length === 0) {
        return {
          content: [{ type: "text", text: "Error: Please provide at least one designer ID to enrich." }],
          isError: true
        };
      }
      
      if (designerIds.length > 10) {
        return {
          content: [{ type: "text", text: "Error: Maximum 10 designers can be enriched at once to avoid rate limits." }],
          isError: true
        };
      }
      
      const { enrichDesignerProfile } = await import('./enrichment.js');
      
      interface BulkEnrichResult {
        designerId: number;
        name?: string;
        status: 'not_found' | 'enriched' | 'no_data' | 'error';
        newFields?: string[];
        confidence?: number;
        error?: string;
      }
      const results: BulkEnrichResult[] = [];
      
      for (const designerId of designerIds) {
        const designer = await db.query.designers.findFirst({
          where: and(
            eq(designers.id, designerId),
            eq(designers.workspaceId, authContext.workspaceId)
          )
        });
        
        if (!designer) {
          results.push({ designerId, status: 'not_found' });
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
            
            results.push({
              designerId,
              name: designer.name,
              status: 'enriched',
              newFields,
              confidence: enrichmentResult.confidence
            });
          } else {
            results.push({ designerId, name: designer.name, status: 'no_data' });
          }
        } catch (error) {
          results.push({
            designerId,
            name: designer.name,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown'
          });
        }
      }
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            processed: designerIds.length,
            results,
            hint: "Use enrich_designer on individual designers to see full suggestions, then apply_enrichment to apply them."
          }, null, 2)
        }]
      };
    }

    default:
      return { 
        content: [{ 
          type: "text", 
          text: `Error: Unknown tool '${name}'. Available tools: ${TOOLS.map(t => t.name).join(', ')}` 
        }],
        isError: true
      };
  }
}

export function setupMcpRoutes(app: Express) {
  app.get("/mcp/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", service: "tapestry-mcp", transport: "streamable-http" });
  });

  app.post("/mcp", async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: "Missing or invalid Authorization header. Expected: Bearer tap_xxx" });
      return;
    }

    const token = authHeader.substring(7);
    const authContext = await validateToken(token);
    if (!authContext) {
      res.status(401).json({ error: "Invalid or expired API token." });
      return;
    }

    const server = new Server(
      { name: "tapestry", version: "1.0.0" },
      { capabilities: { tools: {} } }
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: TOOLS };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      try {
        return await handleToolCall(name, args as Record<string, unknown> || {}, authContext);
      } catch (error: unknown) {
        console.error(`MCP tool error (${name}):`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { 
          content: [{ 
            type: "text", 
            text: `Error executing '${name}': ${message}. If this persists, please check your parameters and try again, or contact support.` 
          }],
          isError: true
        };
      }
    });

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    await server.connect(transport);

    await transport.handleRequest(req, res, req.body);
  });

  app.get("/mcp", async (_req: Request, res: Response) => {
    res.status(405).json({ error: "Method not allowed. Use POST for MCP Streamable HTTP requests." });
  });

  app.delete("/mcp", async (_req: Request, res: Response) => {
    res.status(405).json({ error: "Method not allowed. This server runs in stateless mode." });
  });

  console.log("MCP Streamable HTTP routes registered at /mcp");
}
