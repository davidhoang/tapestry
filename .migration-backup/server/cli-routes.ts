import { Express, Request, Response, NextFunction } from "express";
import { db } from "@db";
import {
  designers,
  lists,
  listDesigners,
  apiTokens,
  workspaces,
  designerEvents,
} from "@db/schema";
import { eq, and, desc, or, ilike, sql } from "drizzle-orm";
import crypto from "crypto";

interface CliAuthContext {
  userId: number;
  workspaceId: number;
  workspaceName: string;
  workspaceSlug: string;
  role: string;
  userEmail: string;
}

declare module "express-serve-static-core" {
  interface Request {
    cliAuth?: CliAuthContext;
  }
}

async function validateCliToken(token: string): Promise<CliAuthContext | null> {
  if (!token || !token.startsWith("tap_")) return null;

  const rawToken = token.substring(4);
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const record = await db.query.apiTokens.findFirst({
    where: eq(apiTokens.tokenHash, tokenHash),
    with: { user: true, workspace: true },
  });

  if (!record) return null;
  if (record.expiresAt && new Date() > record.expiresAt) return null;

  await db
    .update(apiTokens)
    .set({
      lastUsedAt: new Date(),
      usageCount: sql`COALESCE(${apiTokens.usageCount}, 0) + 1`,
    })
    .where(eq(apiTokens.id, record.id));

  return {
    userId: record.userId,
    workspaceId: record.workspaceId,
    workspaceName: record.workspace.name,
    workspaceSlug: record.workspace.slug,
    role: record.role,
    userEmail: record.user.email,
  };
}

async function requireCliAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing Authorization: Bearer tap_xxx header" });
    return;
  }
  const token = header.substring(7);
  const ctx = await validateCliToken(token);
  if (!ctx) {
    res.status(401).json({ error: "Invalid or expired API token" });
    return;
  }
  req.cliAuth = ctx;
  next();
}

function hasWrite(role: string) {
  return ["owner", "admin", "editor"].includes(role);
}

export function setupCliRoutes(app: Express) {
  const auth = requireCliAuth;

  // ── Workspace ──────────────────────────────────────────────────────────────
  app.get("/api/cli/workspace", auth, async (req: Request, res: Response) => {
    const ctx = req.cliAuth!;
    const [designerCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(designers)
      .where(eq(designers.workspaceId, ctx.workspaceId));
    const [listCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(lists)
      .where(eq(lists.workspaceId, ctx.workspaceId));
    res.json({
      name: ctx.workspaceName,
      slug: ctx.workspaceSlug,
      role: ctx.role,
      userEmail: ctx.userEmail,
      stats: {
        designers: Number(designerCount?.count ?? 0),
        lists: Number(listCount?.count ?? 0),
      },
    });
  });

  // ── Designers ──────────────────────────────────────────────────────────────
  app.get("/api/cli/designers", auth, async (req: Request, res: Response) => {
    const ctx = req.cliAuth!;
    const { q, skill, location, limit = "20", offset = "0" } = req.query as Record<string, string>;

    const conditions: ReturnType<typeof eq>[] = [
      eq(designers.workspaceId, ctx.workspaceId) as any,
    ];
    if (q) {
      conditions.push(
        or(
          ilike(designers.name, `%${q}%`),
          ilike(designers.title, `%${q}%`),
          sql`${designers.skills}::text ILIKE ${"%" + q + "%"}`
        )! as any
      );
    }
    if (skill) {
      conditions.push(
        sql`${designers.skills}::text ILIKE ${"%" + skill + "%"}` as any
      );
    }
    if (location) {
      conditions.push(ilike(designers.location, `%${location}%`) as any);
    }

    const lim = Math.min(parseInt(limit) || 20, 50);
    const off = Math.max(parseInt(offset) || 0, 0);

    const [total] = await db
      .select({ count: sql<number>`count(*)` })
      .from(designers)
      .where(and(...conditions));

    const rows = await db.query.designers.findMany({
      where: and(...conditions),
      orderBy: desc(designers.createdAt),
      limit: lim,
      offset: off,
    });

    res.json({
      results: rows.map((d) => ({
        id: d.id,
        name: d.name,
        title: d.title,
        level: d.level,
        company: d.company,
        location: d.location,
        email: d.email,
        skills: d.skills,
        available: d.available,
      })),
      total: Number(total?.count ?? 0),
      offset: off,
      limit: lim,
    });
  });

  app.get("/api/cli/designers/:id", auth, async (req: Request, res: Response) => {
    const ctx = req.cliAuth!;
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid designer ID" });
      return;
    }
    const d = await db.query.designers.findFirst({
      where: and(eq(designers.id, id), eq(designers.workspaceId, ctx.workspaceId)),
    });
    if (!d) {
      res.status(404).json({ error: `Designer ${id} not found` });
      return;
    }
    res.json(d);
  });

  app.post("/api/cli/designers", auth, async (req: Request, res: Response) => {
    const ctx = req.cliAuth!;
    if (!hasWrite(ctx.role)) {
      res.status(403).json({ error: "Your role does not allow creating designers" });
      return;
    }
    const { name, title, level, skills, location, company, email, linkedIn, website, description, notes } = req.body;
    if (!name || !title || !level || !skills) {
      res.status(400).json({ error: "Required: name, title, level, skills" });
      return;
    }
    const [created] = await db.insert(designers).values({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      name,
      title,
      level,
      skills: Array.isArray(skills) ? skills : [skills],
      location: location ?? null,
      company: company ?? null,
      email: email ?? null,
      linkedIn: linkedIn ?? null,
      website: website ?? null,
      description: description ?? null,
      notes: notes ?? null,
      available: false,
    }).returning();
    res.status(201).json(created);
  });

  app.patch("/api/cli/designers/:id", auth, async (req: Request, res: Response) => {
    const ctx = req.cliAuth!;
    if (!hasWrite(ctx.role)) {
      res.status(403).json({ error: "Your role does not allow editing designers" });
      return;
    }
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid designer ID" }); return; }

    const existing = await db.query.designers.findFirst({
      where: and(eq(designers.id, id), eq(designers.workspaceId, ctx.workspaceId)),
    });
    if (!existing) { res.status(404).json({ error: `Designer ${id} not found` }); return; }

    const allowed = ["name","title","level","skills","location","company","email","linkedIn","website","description","notes","available"];
    const updates: Record<string, unknown> = {};
    for (const f of allowed) {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    }
    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }
    const [updated] = await db.update(designers).set(updates).where(eq(designers.id, id)).returning();
    res.json(updated);
  });

  // ── Lists ──────────────────────────────────────────────────────────────────
  app.get("/api/cli/lists", auth, async (req: Request, res: Response) => {
    const ctx = req.cliAuth!;
    const rows = await db.query.lists.findMany({
      where: eq(lists.workspaceId, ctx.workspaceId),
      orderBy: desc(lists.createdAt),
    });
    const withCounts = await Promise.all(
      rows.map(async (l) => {
        const [c] = await db
          .select({ count: sql<number>`count(*)` })
          .from(listDesigners)
          .where(eq(listDesigners.listId, l.id));
        return { ...l, designerCount: Number(c?.count ?? 0) };
      })
    );
    res.json(withCounts);
  });

  app.post("/api/cli/lists", auth, async (req: Request, res: Response) => {
    const ctx = req.cliAuth!;
    if (!hasWrite(ctx.role)) {
      res.status(403).json({ error: "Your role does not allow creating lists" });
      return;
    }
    const { name, description, isPublic } = req.body;
    if (!name) { res.status(400).json({ error: "Required: name" }); return; }

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString(36)}`;
    const [created] = await db.insert(lists).values({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      name,
      description: description ?? null,
      slug,
      isPublic: isPublic ?? false,
    }).returning();
    res.status(201).json(created);
  });

  app.post("/api/cli/lists/:id/designers", auth, async (req: Request, res: Response) => {
    const ctx = req.cliAuth!;
    if (!hasWrite(ctx.role)) {
      res.status(403).json({ error: "Your role does not allow editing lists" });
      return;
    }
    const listId = parseInt(req.params.id);
    const { designerId, notes } = req.body;
    if (!designerId) { res.status(400).json({ error: "Required: designerId" }); return; }

    const list = await db.query.lists.findFirst({
      where: and(eq(lists.id, listId), eq(lists.workspaceId, ctx.workspaceId)),
    });
    if (!list) { res.status(404).json({ error: "List not found" }); return; }

    const designer = await db.query.designers.findFirst({
      where: and(eq(designers.id, designerId), eq(designers.workspaceId, ctx.workspaceId)),
    });
    if (!designer) { res.status(404).json({ error: "Designer not found" }); return; }

    const existing = await db.query.listDesigners.findFirst({
      where: and(eq(listDesigners.listId, listId), eq(listDesigners.designerId, designerId)),
    });
    if (existing) {
      res.status(409).json({ error: `${designer.name} is already in this list` });
      return;
    }
    await db.insert(listDesigners).values({ listId, designerId, notes: notes ?? null });
    res.status(201).json({ message: `Added ${designer.name} to ${list.name}` });
  });

  app.delete("/api/cli/lists/:listId/designers/:designerId", auth, async (req: Request, res: Response) => {
    const ctx = req.cliAuth!;
    if (!hasWrite(ctx.role)) {
      res.status(403).json({ error: "Your role does not allow editing lists" });
      return;
    }
    const listId = parseInt(req.params.listId);
    const designerId = parseInt(req.params.designerId);

    const entry = await db.query.listDesigners.findFirst({
      where: and(eq(listDesigners.listId, listId), eq(listDesigners.designerId, designerId)),
      with: { list: true, designer: true },
    });
    if (!entry || entry.list?.workspaceId !== ctx.workspaceId) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }
    await db.delete(listDesigners).where(eq(listDesigners.id, entry.id));
    res.json({ message: `Removed ${entry.designer?.name} from ${entry.list?.name}` });
  });

  console.log("CLI API routes registered at /api/cli/*");
}
