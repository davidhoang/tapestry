import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { designers, lists, listDesigners } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Designer routes
  app.get("/api/designers", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const allDesigners = await db.query.designers.findMany({
        orderBy: desc(designers.createdAt),
      });
      res.json(allDesigners);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch designers" });
    }
  });

  app.post("/api/designers", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [designer] = await db
        .insert(designers)
        .values({
          ...req.body,
          userId: req.user.id,
        })
        .returning();
      res.json(designer);
    } catch (err) {
      res.status(500).json({ error: "Failed to create designer" });
    }
  });

  // List routes
  app.get("/api/lists", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const userLists = await db.query.lists.findMany({
        where: eq(lists.userId, req.user.id),
        orderBy: desc(lists.createdAt),
      });
      res.json(userLists);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch lists" });
    }
  });

  app.post("/api/lists", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [list] = await db
        .insert(lists)
        .values({
          ...req.body,
          userId: req.user.id,
        })
        .returning();
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: "Failed to create list" });
    }
  });

  app.post("/api/lists/:listId/designers", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [listDesigner] = await db
        .insert(listDesigners)
        .values({
          listId: parseInt(req.params.listId),
          designerId: req.body.designerId,
        })
        .returning();
      res.json(listDesigner);
    } catch (err) {
      res.status(500).json({ error: "Failed to add designer to list" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}