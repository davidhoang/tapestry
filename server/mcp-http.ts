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
          return { content: [{ type: "text", text: "Error: Token is required" }] };
        }
        
        const authContext = await validateToken(token);
        if (!authContext) {
          return { content: [{ type: "text", text: "Error: Invalid or expired token" }] };
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
            text: "Error: Not authenticated. Please use the 'authenticate' tool first with your Tapestry API token."
          }]
        };
      }

      const authContext = session.authContext;

      switch (name) {
        case "search_designers": {
          const { query, skill, location, limit = 20 } = args as any;
          
          let results = await db.query.designers.findMany({
            where: eq(designers.workspaceId, authContext.workspaceId),
            orderBy: desc(designers.createdAt),
            limit: Math.min(limit, 50),
          });

          if (query) {
            const q = query.toLowerCase();
            results = results.filter(d => 
              d.name.toLowerCase().includes(q) ||
              d.title?.toLowerCase().includes(q) ||
              d.skills?.some((s: string) => s.toLowerCase().includes(q))
            );
          }

          if (skill) {
            const s = skill.toLowerCase();
            results = results.filter(d => 
              d.skills?.some((sk: string) => sk.toLowerCase().includes(s))
            );
          }

          if (location) {
            const l = location.toLowerCase();
            results = results.filter(d => 
              d.location?.toLowerCase().includes(l)
            );
          }

          return {
            content: [{
              type: "text",
              text: JSON.stringify(results.map(d => ({
                id: d.id,
                name: d.name,
                title: d.title,
                company: d.company,
                location: d.location,
                skills: d.skills,
                email: d.email,
              })), null, 2)
            }]
          };
        }

        case "get_designer": {
          const { designerId } = args as any;
          
          const designer = await db.query.designers.findFirst({
            where: and(
              eq(designers.id, designerId),
              eq(designers.workspaceId, authContext.workspaceId)
            ),
          });

          if (!designer) {
            return { content: [{ type: "text", text: "Error: Designer not found" }] };
          }

          return {
            content: [{
              type: "text",
              text: JSON.stringify(designer, null, 2)
            }]
          };
        }

        case "list_lists": {
          const allLists = await db.query.lists.findMany({
            where: eq(lists.workspaceId, authContext.workspaceId),
            orderBy: desc(lists.createdAt),
          });

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
          return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
      }
    } catch (error: any) {
      console.error(`MCP tool error (${name}):`, error);
      return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    }
  });

  return server;
}

export function setupMcpRoutes(app: Express) {
  // Simple health check endpoint to verify routing works
  app.get("/mcp/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", service: "tapestry-mcp" });
  });

  app.get("/mcp", async (req: Request, res: Response) => {
    console.log("MCP SSE connection request received");
    
    const sessionId = crypto.randomUUID();
    const transport = new SSEServerTransport("/mcp/message", res);
    
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
