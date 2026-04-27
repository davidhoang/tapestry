import { Request, Response } from "express";
import { db } from "@workspace/db";
import {
  workspaceMembers,
  designers,
  lists,
  listDesigners,
  designerEvents,
  portfolios,
  portfolioProjects,
  portfolioMedia,
  mobileDevices,
} from "@workspace/db";
import { eq, and, desc, ilike, or, sql, count, asc } from "drizzle-orm";
import { createHash } from "crypto";

function generateETag(data: any): string {
  return createHash('md5').update(JSON.stringify(data)).digest('hex');
}

function setCacheHeaders(req: Request, res: Response, data: any, maxAge: number = 60): boolean {
  const etag = generateETag(data);
  const ifNoneMatch = req.headers['if-none-match'];

  // All mobile endpoints are authenticated and workspace-scoped, so caches
  // MUST NOT be shared across users. `private` keeps payloads in the
  // user-agent only; `Vary: Authorization` ensures any well-behaved
  // intermediary keys on the bearer token if it ever sees one.
  res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', `private, max-age=${maxAge}`);
  res.setHeader('Vary', 'Authorization');

  if (ifNoneMatch === etag) {
    res.status(304).end();
    return true;
  }

  return false;
}

async function validateAuthAndWorkspace(req: Request, res: Response): Promise<{ userId: number; workspaceId: number } | null> {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required. Use a valid Clerk session token." });
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

  const membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.userId, req.user.id),
      eq(workspaceMembers.workspaceId, workspaceId)
    ),
  });

  if (!membership) {
    res.status(403).json({ error: "Access denied to this workspace" });
    return null;
  }

  return { userId: req.user.id, workspaceId };
}

export function setupMobileAuth(app: any) {
  app.post("/api/mobile/login", (_req: Request, res: Response) => {
    res.status(410).json({
      error: "This endpoint has been removed. Please use Clerk's mobile SDK (@clerk/expo or @clerk/react-native) to authenticate and send the resulting session token as a Bearer token.",
    });
  });

  app.post("/api/mobile/refresh", (_req: Request, res: Response) => {
    res.status(410).json({
      error: "This endpoint has been removed. Clerk manages token refresh automatically via its mobile SDK.",
    });
  });

  app.get("/api/mobile/user", async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    res.json({
      id: req.user.id,
      email: req.user.email,
      isAdmin: req.user.isAdmin,
      createdAt: req.user.createdAt,
    });
  });

  app.get("/api/mobile/workspaces", async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const memberships = await db.query.workspaceMembers.findMany({
        where: eq(workspaceMembers.userId, req.user.id),
        with: { workspace: true },
      });

      const userWorkspaces = memberships.map((m) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        role: m.role,
        isDefault: memberships.length === 1 || m.role === 'owner',
      }));

      const responseData = { workspaces: userWorkspaces };
      if (setCacheHeaders(req, res, responseData, 300)) return;
      res.json(responseData);
    } catch (error) {
      console.error("Get workspaces error:", error);
      res.status(500).json({ error: "Failed to get workspaces" });
    }
  });

  app.get("/api/mobile/recommendations", async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const memberships = await db.query.workspaceMembers.findMany({
        where: eq(workspaceMembers.userId, req.user.id),
        with: { workspace: true },
      });

      if (memberships.length === 0) {
        return res.status(404).json({ error: "No workspace found for user" });
      }

      const defaultMembership = memberships.find(m => m.role === 'owner') || memberships[0];
      const workspaceId = defaultMembership.workspace.id;

      const workspaceDesigners = await db.query.designers.findMany({
        where: eq(designers.workspaceId, workspaceId),
        orderBy: desc(designers.createdAt),
        limit: 20,
      });

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

      const responseData = {
        workspace: {
          id: defaultMembership.workspace.id,
          name: defaultMembership.workspace.name,
          slug: defaultMembership.workspace.slug,
        },
        recommendations,
        total: recommendations.length,
      };
      if (setCacheHeaders(req, res, responseData, 60)) return;
      res.json(responseData);
    } catch (error) {
      console.error("Get mobile recommendations error:", error);
      res.status(500).json({ error: "Failed to get recommendations" });
    }
  });

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

      if (skill) {
        conditions.push(
          sql`${designers.skills}::jsonb @> ${JSON.stringify([skill])}::jsonb`
        );
      }

      const whereClause = and(...conditions);

      const [countResult] = await db
        .select({ count: count() })
        .from(designers)
        .where(whereClause);

      const total = countResult?.count || 0;

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

      const responseData = {
        designers: formattedDesigners,
        total,
        hasMore: offset + designersList.length < total,
        offset,
      };
      if (setCacheHeaders(req, res, responseData, 60)) return;
      res.json(responseData);
    } catch (error) {
      console.error("Get mobile designers error:", error);
      res.status(500).json({ error: "Failed to get designers" });
    }
  });

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

      const [eventCountResult] = await db
        .select({ count: count() })
        .from(designerEvents)
        .where(and(
          eq(designerEvents.designerId, designerId),
          eq(designerEvents.workspaceId, workspaceId)
        ));

      const responseData = {
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
      };
      if (setCacheHeaders(req, res, responseData, 120)) return;
      res.json(responseData);
    } catch (error) {
      console.error("Get mobile designer error:", error);
      res.status(500).json({ error: "Failed to get designer" });
    }
  });

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

      const designer = await db.query.designers.findFirst({
        where: and(
          eq(designers.id, designerId),
          eq(designers.workspaceId, workspaceId)
        ),
      });

      if (!designer) {
        return res.status(404).json({ error: "Designer not found" });
      }

      const [countResult] = await db
        .select({ count: count() })
        .from(designerEvents)
        .where(and(
          eq(designerEvents.designerId, designerId),
          eq(designerEvents.workspaceId, workspaceId)
        ));

      const total = countResult?.count || 0;

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

      const responseData = {
        events: formattedEvents,
        total,
        hasMore: offset + events.length < total,
      };
      if (setCacheHeaders(req, res, responseData, 30)) return;
      res.json(responseData);
    } catch (error) {
      console.error("Get designer timeline error:", error);
      res.status(500).json({ error: "Failed to get timeline" });
    }
  });

  app.get("/api/mobile/designers/:id/portfolio", async (req: Request, res: Response) => {
    try {
      const auth = await validateAuthAndWorkspace(req, res);
      if (!auth) return;

      const { workspaceId } = auth;
      const designerId = parseInt(req.params.id, 10);
      if (isNaN(designerId)) {
        return res.status(400).json({ error: "Invalid designer ID" });
      }

      // Confirm designer belongs to this workspace before exposing portfolio.
      const designer = await db.query.designers.findFirst({
        where: and(
          eq(designers.id, designerId),
          eq(designers.workspaceId, workspaceId),
        ),
        columns: { id: true },
      });
      if (!designer) {
        return res.status(404).json({ error: "Designer not found" });
      }

      const portfolio = await db.query.portfolios.findFirst({
        where: and(
          eq(portfolios.designerId, designerId),
          eq(portfolios.isActive, true),
        ),
      });

      if (!portfolio) {
        const emptyPayload = {
          portfolio: null,
          projects: [],
          media: [],
        };
        if (setCacheHeaders(req, res, emptyPayload, 120)) return;
        return res.json(emptyPayload);
      }

      const projects = await db
        .select()
        .from(portfolioProjects)
        .where(and(
          eq(portfolioProjects.portfolioId, portfolio.id),
          eq(portfolioProjects.isPublic, true),
        ))
        .orderBy(desc(portfolioProjects.isFeatured), asc(portfolioProjects.sortOrder));

      const allMedia = await db
        .select()
        .from(portfolioMedia)
        .where(eq(portfolioMedia.portfolioId, portfolio.id))
        .orderBy(asc(portfolioMedia.sortOrder));

      // Media without a projectId belongs at the portfolio level (always
      // OK to surface). Media tied to a project must belong to a published
      // project, otherwise we'd leak unpublished/draft work.
      const publicProjectIds = new Set(projects.map((p) => p.id));
      const media = allMedia.filter(
        (m) => m.projectId == null || publicProjectIds.has(m.projectId),
      );

      const payload = {
        portfolio: {
          id: portfolio.id,
          title: portfolio.title,
          tagline: portfolio.tagline,
          description: portfolio.description,
          theme: portfolio.theme,
          primaryColor: portfolio.primaryColor,
          socialLinks: portfolio.socialLinks ?? null,
          contactInfo: portfolio.contactInfo ?? null,
        },
        projects: projects.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          category: p.category,
          tags: p.tags ?? [],
          coverImageUrl: p.coverImageUrl,
          projectUrl: p.projectUrl,
          isFeatured: p.isFeatured ?? false,
          role: p.role,
          duration: p.duration,
          clientName: p.clientName,
          projectDate: p.projectDate,
        })),
        media: media.map((m) => ({
          id: m.id,
          projectId: m.projectId,
          fileUrl: m.fileUrl,
          fileType: m.fileType,
          mimeType: m.mimeType,
          width: m.width,
          height: m.height,
          alt: m.alt,
          caption: m.caption,
        })),
      };

      if (setCacheHeaders(req, res, payload, 120)) return;
      res.json(payload);
    } catch (error) {
      console.error("Get designer portfolio error:", error);
      res.status(500).json({ error: "Failed to get portfolio" });
    }
  });

  app.post("/api/mobile/devices/register", async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Authentication required" });

      const { token, platform } = req.body ?? {};
      if (typeof token !== "string" || token.length < 8 || token.length > 1024) {
        return res.status(400).json({ error: "Invalid push token" });
      }
      const normalizedPlatform =
        platform === "ios" || platform === "android" || platform === "web"
          ? platform
          : "ios";

      // Upsert by token. If another user previously owned this token (e.g.
      // a shared physical device), reassign it.
      const existing = await db.query.mobileDevices.findFirst({
        where: eq(mobileDevices.token, token),
      });

      if (existing) {
        await db
          .update(mobileDevices)
          .set({
            userId: req.user.id,
            platform: normalizedPlatform,
            optedIn: true,
            lastSeenAt: new Date(),
          })
          .where(eq(mobileDevices.id, existing.id));
      } else {
        await db.insert(mobileDevices).values({
          userId: req.user.id,
          token,
          platform: normalizedPlatform,
          optedIn: true,
        });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Register device error:", error);
      res.status(500).json({ error: "Failed to register device" });
    }
  });

  app.delete("/api/mobile/devices/register", async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Authentication required" });

      const { token } = req.body ?? {};
      if (typeof token !== "string" || !token) {
        return res.status(400).json({ error: "token required" });
      }

      await db
        .update(mobileDevices)
        .set({ optedIn: false, lastSeenAt: new Date() })
        .where(and(eq(mobileDevices.token, token), eq(mobileDevices.userId, req.user.id)));

      res.status(204).end();
    } catch (error) {
      console.error("Unregister device error:", error);
      res.status(500).json({ error: "Failed to unregister device" });
    }
  });

  app.get("/api/mobile/lists", async (req: Request, res: Response) => {
    try {
      const auth = await validateAuthAndWorkspace(req, res);
      if (!auth) return;

      const { workspaceId } = auth;

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

      const responseData = { lists: listsWithCounts };
      if (setCacheHeaders(req, res, responseData, 60)) return;
      res.json(responseData);
    } catch (error) {
      console.error("Get mobile lists error:", error);
      res.status(500).json({ error: "Failed to get lists" });
    }
  });

  app.get("/api/mobile/lists/:id/designers", async (req: Request, res: Response) => {
    try {
      const auth = await validateAuthAndWorkspace(req, res);
      if (!auth) return;

      const { workspaceId } = auth;
      const listId = parseInt(req.params.id, 10);

      if (isNaN(listId)) {
        return res.status(400).json({ error: "Invalid list ID" });
      }

      const list = await db.query.lists.findFirst({
        where: and(
          eq(lists.id, listId),
          eq(lists.workspaceId, workspaceId)
        ),
      });

      if (!list) {
        return res.status(404).json({ error: "List not found" });
      }

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

      const responseData = {
        list: { id: list.id, name: list.name },
        designers: formattedDesigners,
        total: formattedDesigners.length,
      };
      if (setCacheHeaders(req, res, responseData, 60)) return;
      res.json(responseData);
    } catch (error) {
      console.error("Get list designers error:", error);
      res.status(500).json({ error: "Failed to get list designers" });
    }
  });
}
