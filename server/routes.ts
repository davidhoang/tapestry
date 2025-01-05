import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { designers, lists, listDesigners } from "@db/schema";
import { eq, desc, and, ne, inArray } from "drizzle-orm";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import express from "express";

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed.'));
    }
  },
});

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

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
      console.error('Error fetching designers:', err);
      res.status(500).json({ error: "Failed to fetch designers" });
    }
  });

  app.post("/api/designers", upload.single('photo'), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      if (!req.body.data) {
        return res.status(400).json({ error: "Designer data is required" });
      }

      let designerData;
      try {
        designerData = JSON.parse(req.body.data);
      } catch (err) {
        console.error('Error parsing designer data:', err);
        return res.status(400).json({ error: "Invalid designer data format" });
      }

      // Check if email already exists
      const existingDesigner = await db.query.designers.findFirst({
        where: eq(designers.email, designerData.email),
      });

      if (existingDesigner) {
        return res.status(400).json({ error: "Email already exists" });
      }

      let photoUrl;
      if (req.file) {
        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
        const filepath = path.join(uploadsDir, filename);

        try {
          await sharp(req.file.buffer)
            .resize(800, 800, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .webp({ quality: 80 })
            .toFile(filepath);

          photoUrl = `/uploads/${filename}`;
        } catch (err) {
          console.error('Error processing image:', err);
          return res.status(500).json({ error: "Failed to process image" });
        }
      }

      const [designer] = await db
        .insert(designers)
        .values({
          ...designerData,
          userId: req.user.id,
          photoUrl,
        })
        .returning();

      res.json(designer);
    } catch (err) {
      console.error('Error creating designer:', err);
      res.status(500).json({ error: "Failed to create designer" });
    }
  });

  app.put("/api/designers/:id", upload.single('photo'), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const designerId = parseInt(req.params.id);

    try {
      if (!req.body.data) {
        return res.status(400).json({ error: "Designer data is required" });
      }

      let designerData;
      try {
        designerData = JSON.parse(req.body.data);
      } catch (err) {
        console.error('Error parsing designer data:', err);
        return res.status(400).json({ error: "Invalid designer data format" });
      }

      // Check if email already exists for a different designer
      const existingDesigner = await db.query.designers.findFirst({
        where: and(
          eq(designers.email, designerData.email),
          ne(designers.id, designerId)
        ),
      });

      if (existingDesigner) {
        return res.status(400).json({ error: "Email already exists" });
      }

      let photoUrl;
      if (req.file) {
        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
        const filepath = path.join(uploadsDir, filename);

        try {
          await sharp(req.file.buffer)
            .resize(800, 800, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .webp({ quality: 80 })
            .toFile(filepath);

          photoUrl = `/uploads/${filename}`;
        } catch (err) {
          console.error('Error processing image:', err);
          return res.status(500).json({ error: "Failed to process image" });
        }
      }

      const [designer] = await db
        .update(designers)
        .set({
          ...designerData,
          ...(photoUrl && { photoUrl }),
        })
        .where(eq(designers.id, designerId))
        .returning();

      res.json(designer);
    } catch (err) {
      console.error('Error updating designer:', err);
      res.status(500).json({ error: "Failed to update designer" });
    }
  });

  app.delete("/api/designers/batch", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ error: "Invalid request format" });
      }

      const result = await db
        .delete(designers)
        .where(inArray(designers.id, ids))
        .returning();

      res.json(result);
    } catch (err) {
      console.error('Error deleting designers:', err);
      res.status(500).json({ error: "Failed to delete designers" });
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