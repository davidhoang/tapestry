import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
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

const sessions = new Map<string, { transport: SSEServerTransport; authContext: AuthContext | null }>();

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
    .set({ lastUsedAt: new Date() })
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
    name: "list_lists",
    description: "Get all designer lists in your workspace",
    inputSchema: {
      type: "object" as const,
      properties: {}
    }
  },
  {
    name: "workspace_info",
    description: "Get information about the current authenticated workspace",
    inputSchema: {
      type: "object" as const,
      properties: {}
    }
  }
];

function createMcpServer(sessionId: string) {
  const server = new Server(
    { name: "tapestry", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const session = sessions.get(sessionId);
    
    try {
      if (name === "authenticate") {
        const token = (args as any)?.token;
        if (!token) {
          return { 
            content: [{ 
              type: "text", 
              text: "Error: Token is required. Please provide your Tapestry API token (starts with 'tap_'). You can generate one from Settings > API Tokens in your Tapestry workspace." 
            }] 
          };
        }
        
        const authContext = await validateToken(token);
        if (!authContext) {
          return { 
            content: [{ 
              type: "text", 
              text: "Error: Invalid or expired token. Please check that your token is correct and hasn't expired. You can generate a new token from Settings > API Tokens in your Tapestry workspace." 
            }] 
          };
        }
        
        if (session) {
          session.authContext = authContext;
        }
        
        return {
          content: [{
            type: "text",
            text: `Successfully authenticated! Connected to workspace "${authContext.workspaceName}" as ${authContext.userEmail} (${authContext.role})`
          }]
        };
      }

      if (!session?.authContext) {
        return {
          content: [{
            type: "text",
            text: "Error: Not authenticated. Please use the 'authenticate' tool first with your Tapestry API token. Example: authenticate({ token: 'tap_your_token_here' })"
          }]
        };
      }

      const authContext = session.authContext;

      switch (name) {
        case "search_designers": {
          const { query, skill, location, limit = 20, offset = 0 } = args as any;
          
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
          
          const results = await db.query.designers.findMany({
            where: and(...conditions),
            orderBy: desc(designers.createdAt),
            limit: Math.min(limit, 50),
            offset: Math.max(0, offset),
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
                count: results.length,
                offset,
                hasMore: results.length === Math.min(limit, 50)
              }, null, 2)
            }]
          };
        }

        case "quick_search": {
          const { query, limit = 10 } = args as any;
          
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
          const { designerId } = args as any;
          
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
              text: JSON.stringify(designer, null, 2)
            }]
          };
        }

        case "get_designer_timeline": {
          const { designerId, limit = 20 } = args as any;
          
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
          const { designerId, content } = args as any;
          
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

        default:
          return { 
            content: [{ 
              type: "text", 
              text: `Error: Unknown tool '${name}'. Available tools: ${TOOLS.map(t => t.name).join(', ')}` 
            }] 
          };
      }
    } catch (error: any) {
      console.error(`MCP tool error (${name}):`, error);
      return { 
        content: [{ 
          type: "text", 
          text: `Error executing '${name}': ${error.message}. If this persists, please check your parameters and try again, or contact support.` 
        }] 
      };
    }
  });

  return server;
}

export function setupMcpRoutes(app: Express) {
  app.get("/mcp/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", service: "tapestry-mcp" });
  });

  app.get("/mcp", async (req: Request, res: Response) => {
    console.log("MCP SSE connection request received");
    
    const sessionId = crypto.randomUUID();
    const transport = new SSEServerTransport(`/mcp/message?sessionId=${sessionId}`, res);
    
    sessions.set(sessionId, { transport, authContext: null });
    
    const server = createMcpServer(sessionId);
    
    res.on("close", () => {
      console.log(`MCP session ${sessionId} closed`);
      sessions.delete(sessionId);
    });

    try {
      await server.connect(transport);
      console.log(`MCP session ${sessionId} connected`);
    } catch (error) {
      console.error("MCP connection error:", error);
      sessions.delete(sessionId);
    }
  });

  app.post("/mcp/message", async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    
    if (!sessionId || !sessions.has(sessionId)) {
      return res.status(400).json({ error: "Invalid session" });
    }

    const session = sessions.get(sessionId)!;
    
    try {
      await session.transport.handlePostMessage(req, res);
    } catch (error) {
      console.error("MCP message error:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  console.log("MCP HTTP routes registered at /mcp");
}
