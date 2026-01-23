import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { db } from "@db";
import { users, workspaceMembers, workspaces, designers, lists, listDesigners, designerEvents } from "@db/schema";
import { eq, and, desc, ilike, or, sql, count } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || process.env.REPL_ID || "tapestry-jwt-secret";
const ACCESS_TOKEN_EXPIRY = "1h";
const REFRESH_TOKEN_EXPIRY = "30d";

interface TokenPayload {
  userId: number;
  email: string;
  type: "access" | "refresh";
}

const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    if (!storedPassword || !storedPassword.includes('.')) {
      return false;
    }
    const [hashedPassword, salt] = storedPassword.split(".");
    if (!hashedPassword || !salt) {
      return false;
    }
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
};

export function generateAccessToken(userId: number, email: string): string {
  return jwt.sign(
    { userId, email, type: "access" } as TokenPayload,
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

export function generateRefreshToken(userId: number, email: string): string {
  return jwt.sign(
    { userId, email, type: "refresh" } as TokenPayload,
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload || payload.type !== "access") {
    return next();
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (user) {
      req.user = user;
      // Mark request as authenticated for Passport compatibility
      // This allows JWT-authenticated requests to pass isAuthenticated() checks
      (req as any).isAuthenticated = () => true;
      (req as any).isUnauthenticated = () => false;
      (req as any).login = (user: any, cb: any) => cb && cb(null);
      (req as any).logIn = (user: any, cb: any) => cb && cb(null);
      (req as any).logout = (cb: any) => cb && cb(null);
      (req as any).logOut = (cb: any) => cb && cb(null);
    }
  } catch (error) {
    console.error("JWT auth error:", error);
  }

  next();
}

export function setupMobileAuth(app: any) {
  app.post("/api/mobile/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isMatch = await crypto.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const accessToken = generateAccessToken(user.id, user.email);
      const refreshToken = generateRefreshToken(user.id, user.email);

      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          isAdmin: user.isAdmin,
        },
      });
    } catch (error) {
      console.error("Mobile login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/mobile/refresh", async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token is required" });
      }

      const payload = verifyToken(refreshToken);

      if (!payload || payload.type !== "refresh") {
        return res.status(401).json({ error: "Invalid refresh token" });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1);

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const newAccessToken = generateAccessToken(user.id, user.email);
      const newRefreshToken = generateRefreshToken(user.id, user.email);

      res.json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          isAdmin: user.isAdmin,
        },
      });
    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(500).json({ error: "Token refresh failed" });
    }
  });

  app.get("/api/mobile/user", async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization header required" });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || payload.type !== "access") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    try {
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Get user's workspaces
  app.get("/api/mobile/workspaces", async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization header required" });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || payload.type !== "access") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    try {
      const memberships = await db.query.workspaceMembers.findMany({
        where: eq(workspaceMembers.userId, payload.userId),
        with: {
          workspace: true,
        },
      });

      const userWorkspaces = memberships.map((m) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        role: m.role,
        isDefault: memberships.length === 1 || m.role === 'owner',
      }));

      res.json({ workspaces: userWorkspaces });
    } catch (error) {
      console.error("Get workspaces error:", error);
      res.status(500).json({ error: "Failed to get workspaces" });
    }
  });

  // Get recommendations for mobile (uses user's default workspace)
  app.get("/api/mobile/recommendations", async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization header required" });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || payload.type !== "access") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    try {
      // Get user's default workspace (first one they own, or first one they're a member of)
      const memberships = await db.query.workspaceMembers.findMany({
        where: eq(workspaceMembers.userId, payload.userId),
        with: {
          workspace: true,
        },
      });

      if (memberships.length === 0) {
        return res.status(404).json({ error: "No workspace found for user" });
      }

      // Prefer workspace where user is owner, otherwise use first one
      const defaultMembership = memberships.find(m => m.role === 'owner') || memberships[0];
      const workspaceId = defaultMembership.workspace.id;

      // Get designers from the workspace
      const workspaceDesigners = await db.query.designers.findMany({
        where: eq(designers.workspaceId, workspaceId),
        orderBy: desc(designers.createdAt),
        limit: 20,
      });

      // Format recommendations for mobile
      const recommendations = workspaceDesigners.map((designer) => ({
        id: designer.id,
        name: designer.name,
        title: designer.title,
        company: designer.company,
        location: designer.location,
        email: designer.email,
        linkedIn: designer.linkedIn,
        website: designer.website,
        photoUrl: designer.photoUrl,
        skills: designer.skills || [],
        description: designer.description,
        createdAt: designer.createdAt,
      }));

      res.json({
        workspace: {
          id: defaultMembership.workspace.id,
          name: defaultMembership.workspace.name,
          slug: defaultMembership.workspace.slug,
        },
        recommendations,
        total: recommendations.length,
      });
    } catch (error) {
      console.error("Get mobile recommendations error:", error);
      res.status(500).json({ error: "Failed to get recommendations" });
    }
  });

  // Helper function to validate JWT and workspace membership
  async function validateAuthAndWorkspace(req: Request, res: Response): Promise<{ userId: number; workspaceId: number } | null> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authorization header required" });
      return null;
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || payload.type !== "access") {
      res.status(401).json({ error: "Invalid or expired token" });
      return null;
    }

    const workspaceIdParam = req.query.workspaceId;
    if (!workspaceIdParam) {
      res.status(400).json({ error: "workspaceId is required" });
      return null;
    }

    const workspaceId = parseInt(workspaceIdParam as string, 10);
    if (isNaN(workspaceId)) {
      res.status(400).json({ error: "Invalid workspaceId" });
      return null;
    }

    // Validate user is a member of the workspace
    const membership = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.userId, payload.userId),
        eq(workspaceMembers.workspaceId, workspaceId)
      ),
    });

    if (!membership) {
      res.status(403).json({ error: "Access denied to this workspace" });
      return null;
    }

    return { userId: payload.userId, workspaceId };
  }

  // GET /api/mobile/designers - Search/list designers with pagination
  app.get("/api/mobile/designers", async (req: Request, res: Response) => {
    try {
      const auth = await validateAuthAndWorkspace(req, res);
      if (!auth) return;

      const { workspaceId } = auth;
      const query = req.query.query as string | undefined;
      const skill = req.query.skill as string | undefined;
      const location = req.query.location as string | undefined;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      // Build filter conditions
      const conditions = [eq(designers.workspaceId, workspaceId)];

      if (query) {
        conditions.push(
          or(
            ilike(designers.name, `%${query}%`),
            ilike(designers.title, `%${query}%`),
            ilike(designers.company, `%${query}%`),
            ilike(designers.email, `%${query}%`)
          )!
        );
      }

      if (location) {
        conditions.push(ilike(designers.location, `%${location}%`));
      }

      // For skill filtering, we use SQL array contains
      if (skill) {
        conditions.push(
          sql`${designers.skills}::jsonb @> ${JSON.stringify([skill])}::jsonb`
        );
      }

      const whereClause = and(...conditions);

      // Get total count
      const [countResult] = await db
        .select({ count: count() })
        .from(designers)
        .where(whereClause);

      const total = countResult?.count || 0;

      // Get designers with pagination
      const designersList = await db
        .select()
        .from(designers)
        .where(whereClause)
        .orderBy(desc(designers.createdAt))
        .limit(limit)
        .offset(offset);

      const formattedDesigners = designersList.map((designer) => ({
        id: designer.id,
        name: designer.name,
        title: designer.title,
        company: designer.company,
        location: designer.location,
        email: designer.email,
        linkedIn: designer.linkedIn,
        website: designer.website,
        photoUrl: designer.photoUrl,
        skills: designer.skills || [],
        description: designer.description,
        available: designer.available,
        createdAt: designer.createdAt,
      }));

      res.json({
        designers: formattedDesigners,
        total,
        hasMore: offset + designersList.length < total,
        offset,
      });
    } catch (error) {
      console.error("Get mobile designers error:", error);
      res.status(500).json({ error: "Failed to get designers" });
    }
  });

  // GET /api/mobile/designers/:id - Get single designer details
  app.get("/api/mobile/designers/:id", async (req: Request, res: Response) => {
    try {
      const auth = await validateAuthAndWorkspace(req, res);
      if (!auth) return;

      const { workspaceId } = auth;
      const designerId = parseInt(req.params.id, 10);

      if (isNaN(designerId)) {
        return res.status(400).json({ error: "Invalid designer ID" });
      }

      const designer = await db.query.designers.findFirst({
        where: and(
          eq(designers.id, designerId),
          eq(designers.workspaceId, workspaceId)
        ),
      });

      if (!designer) {
        return res.status(404).json({ error: "Designer not found" });
      }

      // Get timeline event count
      const [eventCountResult] = await db
        .select({ count: count() })
        .from(designerEvents)
        .where(and(
          eq(designerEvents.designerId, designerId),
          eq(designerEvents.workspaceId, workspaceId)
        ));

      res.json({
        id: designer.id,
        name: designer.name,
        title: designer.title,
        company: designer.company,
        location: designer.location,
        level: designer.level,
        email: designer.email,
        phoneNumber: designer.phoneNumber,
        linkedIn: designer.linkedIn,
        website: designer.website,
        photoUrl: designer.photoUrl,
        skills: designer.skills || [],
        description: designer.description,
        notes: designer.notes,
        available: designer.available,
        enrichedAt: designer.enrichedAt,
        enrichmentSource: designer.enrichmentSource,
        createdAt: designer.createdAt,
        timelineEventCount: eventCountResult?.count || 0,
      });
    } catch (error) {
      console.error("Get mobile designer error:", error);
      res.status(500).json({ error: "Failed to get designer" });
    }
  });

  // GET /api/mobile/designers/:id/timeline - Get designer timeline
  app.get("/api/mobile/designers/:id/timeline", async (req: Request, res: Response) => {
    try {
      const auth = await validateAuthAndWorkspace(req, res);
      if (!auth) return;

      const { workspaceId } = auth;
      const designerId = parseInt(req.params.id, 10);
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      if (isNaN(designerId)) {
        return res.status(400).json({ error: "Invalid designer ID" });
      }

      // Verify designer exists and belongs to workspace
      const designer = await db.query.designers.findFirst({
        where: and(
          eq(designers.id, designerId),
          eq(designers.workspaceId, workspaceId)
        ),
      });

      if (!designer) {
        return res.status(404).json({ error: "Designer not found" });
      }

      // Get total count
      const [countResult] = await db
        .select({ count: count() })
        .from(designerEvents)
        .where(and(
          eq(designerEvents.designerId, designerId),
          eq(designerEvents.workspaceId, workspaceId)
        ));

      const total = countResult?.count || 0;

      // Get events with pagination
      const events = await db
        .select()
        .from(designerEvents)
        .where(and(
          eq(designerEvents.designerId, designerId),
          eq(designerEvents.workspaceId, workspaceId)
        ))
        .orderBy(desc(designerEvents.createdAt))
        .limit(limit)
        .offset(offset);

      const formattedEvents = events.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        summary: event.summary,
        source: event.source,
        details: event.details,
        createdAt: event.createdAt,
      }));

      res.json({
        events: formattedEvents,
        total,
        hasMore: offset + events.length < total,
      });
    } catch (error) {
      console.error("Get designer timeline error:", error);
      res.status(500).json({ error: "Failed to get timeline" });
    }
  });

  // GET /api/mobile/lists - Get user's lists
  app.get("/api/mobile/lists", async (req: Request, res: Response) => {
    try {
      const auth = await validateAuthAndWorkspace(req, res);
      if (!auth) return;

      const { workspaceId } = auth;

      // Get lists with designer counts using a subquery
      const userLists = await db
        .select({
          id: lists.id,
          name: lists.name,
          description: lists.description,
          isPublic: lists.isPublic,
          createdAt: lists.createdAt,
        })
        .from(lists)
        .where(eq(lists.workspaceId, workspaceId))
        .orderBy(desc(lists.createdAt));

      // Get designer counts for each list
      const listsWithCounts = await Promise.all(
        userLists.map(async (list) => {
          const [countResult] = await db
            .select({ count: count() })
            .from(listDesigners)
            .where(eq(listDesigners.listId, list.id));

          return {
            ...list,
            designerCount: countResult?.count || 0,
          };
        })
      );

      res.json({ lists: listsWithCounts });
    } catch (error) {
      console.error("Get mobile lists error:", error);
      res.status(500).json({ error: "Failed to get lists" });
    }
  });

  // GET /api/mobile/lists/:id/designers - Get designers in a list
  app.get("/api/mobile/lists/:id/designers", async (req: Request, res: Response) => {
    try {
      const auth = await validateAuthAndWorkspace(req, res);
      if (!auth) return;

      const { workspaceId } = auth;
      const listId = parseInt(req.params.id, 10);

      if (isNaN(listId)) {
        return res.status(400).json({ error: "Invalid list ID" });
      }

      // Verify list exists and belongs to workspace
      const list = await db.query.lists.findFirst({
        where: and(
          eq(lists.id, listId),
          eq(lists.workspaceId, workspaceId)
        ),
      });

      if (!list) {
        return res.status(404).json({ error: "List not found" });
      }

      // Get designers in the list
      const listDesignersData = await db
        .select({
          designer: designers,
          addedAt: listDesigners.addedAt,
          notes: listDesigners.notes,
        })
        .from(listDesigners)
        .innerJoin(designers, eq(listDesigners.designerId, designers.id))
        .where(eq(listDesigners.listId, listId))
        .orderBy(desc(listDesigners.addedAt));

      const formattedDesigners = listDesignersData.map((item) => ({
        id: item.designer.id,
        name: item.designer.name,
        title: item.designer.title,
        company: item.designer.company,
        location: item.designer.location,
        email: item.designer.email,
        linkedIn: item.designer.linkedIn,
        website: item.designer.website,
        photoUrl: item.designer.photoUrl,
        skills: item.designer.skills || [],
        description: item.designer.description,
        available: item.designer.available,
        createdAt: item.designer.createdAt,
        addedToListAt: item.addedAt,
        listNotes: item.notes,
      }));

      res.json({
        list: {
          id: list.id,
          name: list.name,
        },
        designers: formattedDesigners,
        total: formattedDesigners.length,
      });
    } catch (error) {
      console.error("Get list designers error:", error);
      res.status(500).json({ error: "Failed to get list designers" });
    }
  });
}
