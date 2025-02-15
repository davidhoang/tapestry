import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { designers, lists, listDesigners } from "@db/schema";
import { eq, desc, and, ne, inArray } from "drizzle-orm";
import { sendListEmail } from "./email";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import express from "express";
import { sql } from "drizzle-orm";
// Add import for Object Storage
import { Client } from "@replit/object-storage";


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

// Add error handler for database operations
const withErrorHandler = (handler: (req: any, res: any) => Promise<any>) => {
  return async (req: any, res: any) => {
    try {
      await handler(req, res);
    } catch (error: any) {
      console.error('Operation failed:', error);

      // Check for specific database errors
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({ 
          error: "This record already exists",
          details: error.detail 
        });
      }

      if (error.code === '23503') { // Foreign key violation
        return res.status(400).json({ 
          error: "Referenced record does not exist",
          details: error.detail 
        });
      }

      // Image processing error
      if (error.message === 'Failed to process image') {
        return res.status(400).json({ 
          error: "Failed to process image",
          details: "Please make sure you're uploading a valid image file"
        });
      }

      // Generic error
      res.status(500).json({ 
        error: "Operation failed",
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  };
};

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Ensure uploads directory exists (no longer used for serving files)
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

  // Serve uploaded files (removed - now served from Object Storage)
  //app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

  // Get all unique skills
  app.get("/api/skills", withErrorHandler(async (_req, res) => {
    try {
      const result = await db.execute(sql`
        WITH skill_arrays AS (
          SELECT ARRAY(
            SELECT DISTINCT jsonb_array_elements_text(skills::jsonb)
            FROM designers
            WHERE skills IS NOT NULL
            ORDER BY 1
          ) AS skills
        )
        SELECT skills FROM skill_arrays;
      `);

      // Add logging to check the response format
      console.log('Skills API Response:', result.rows[0]?.skills);

      // Ensure we return an array, even if empty
      const skills = result.rows[0]?.skills || [];
      res.json(skills);
    } catch (err) {
      console.error('Error fetching skills:', err);
      res.status(500).json({ error: "Failed to fetch skills" });
    }
  }));

  // Designer routes with transaction support
  app.post("/api/designers", upload.single('photo'), withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const result = await db.transaction(async (tx) => {
      if (!req.body.data) {
        throw new Error("Designer data is required");
      }

      let designerData;
      try {
        designerData = JSON.parse(req.body.data);
      } catch (err) {
        throw new Error("Invalid designer data format");
      }

      // Check if email already exists within transaction
      const existingDesigner = await tx.query.designers.findFirst({
        where: eq(designers.email, designerData.email),
      });

      if (existingDesigner) {
        throw new Error("Email already exists");
      }

      let photoUrl;
      if (req.file) {
        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
        let storage;
        try {
          storage = new Client();
        } catch (err) {
          console.error('Failed to initialize storage client:', err);
          throw new Error('Storage initialization failed');
        }

        try {
          // Validate image buffer
          if (!req.file?.buffer) {
            throw new Error("No image data received");
          }

          // Add error handling and logging for image processing
          console.log('Processing image:', {
            originalSize: req.file.buffer.length,
            mimetype: req.file.mimetype
          });

          const processedBuffer = await sharp(req.file.buffer, {
            failOnError: false, // Don't fail on corrupted images
            limitInputPixels: 50000000 // ~50MP limit
          })
            .resize(800, 800, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .webp({ quality: 80 })
            .toBuffer()
            .catch(err => {
              console.error('Sharp processing error:', err);
              throw new Error('Image processing failed');
            });

          console.log('Image processed successfully:', {
            processedSize: processedBuffer.length
          });

          await storage.upload(filename, processedBuffer, {
            contentType: 'image/webp'
          });

          photoUrl = `/api/images/${filename}`;
        } catch (err) {
          throw new Error("Failed to process image");
        }
      }

      const [designer] = await tx
        .insert(designers)
        .values({
          ...designerData,
          userId: req.user.id,
          photoUrl,
        })
        .returning();

      return designer;
    });

    res.json(result);
  }));

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

  app.put("/api/designers/:id", upload.single('photo'), withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const designerId = parseInt(req.params.id);

    try {
      if (!req.body.data) {
        throw new Error("Designer data is required");
      }

      let designerData;
      try {
        designerData = JSON.parse(req.body.data);
      } catch (err) {
        throw new Error("Invalid designer data format");
      }

      // Check if email already exists for a different designer
      const existingDesigner = await db.query.designers.findFirst({
        where: and(
          eq(designers.email, designerData.email),
          ne(designers.id, designerId)
        ),
      });

      if (existingDesigner) {
        throw new Error("Email already exists");
      }

      let photoUrl;
      if (req.file) {
        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
        let storage;
        try {
          storage = new Client();
        } catch (err) {
          console.error('Failed to initialize storage client:', err);
          throw new Error('Storage initialization failed');
        }

        try {
          // Get existing designer to clean up old image
          const existingDesigner = await db.query.designers.findFirst({
            where: eq(designers.id, designerId),
          });

          if (existingDesigner?.photoUrl) {
            const oldFilename = existingDesigner.photoUrl.split('/').pop();
            try {
              await storage.delete(oldFilename);
            } catch (err) {
              console.error('Failed to delete old image:', err);
            }
          }

          // Validate image buffer
          if (!req.file?.buffer) {
            throw new Error("No image data received");
          }

          const processedBuffer = await sharp(req.file.buffer, {
            failOnError: false,
            limitInputPixels: 50000000 // ~50MP limit
          })
            .resize(800, 800, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .webp({ quality: 80 })
            .toBuffer()
            .catch(err => {
              console.error('Sharp processing error:', err);
              throw new Error('Image processing failed');
            });

          await storage.upload(filename, processedBuffer, {
            contentType: 'image/webp'
          });

          photoUrl = `/api/images/${filename}`;
        } catch (err) {
          throw new Error("Failed to process image");
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
  }));

  app.delete("/api/designers/batch", withErrorHandler(async (req, res) => {
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
  }));


  // List routes with transaction support
  app.post("/api/lists", withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const result = await db.transaction(async (tx) => {
      const [list] = await tx
        .insert(lists)
        .values({
          ...req.body,
          userId: req.user.id,
        })
        .returning();

      // If designerIds are provided, add them to the list
      if (req.body.designerIds?.length) {
        await tx.insert(listDesigners)
          .values(
            req.body.designerIds.map((designerId: number) => ({
              listId: list.id,
              designerId,
            }))
          );
      }

      return list;
    });

    res.json(result);
  }));

  app.get("/api/lists", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const userLists = await db.query.lists.findMany({
        where: eq(lists.userId, req.user.id),
        orderBy: desc(lists.createdAt),
        with: {
          designers: {
            with: {
              designer: true,
            },
          },
        },
      });
      res.json(userLists);
    } catch (err) {
      console.error('Error fetching lists:', err);
      res.status(500).json({ error: "Failed to fetch lists" });
    }
  });

  // Update list route (modified to handle notes)
  app.put("/api/lists/:id", withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const listId = parseInt(req.params.id);
      const { name, description, summary, isPublic, designerId, notes } = req.body;

      // Verify the list exists and belongs to the user
      const list = await db.query.lists.findFirst({
        where: eq(lists.id, listId),
      });

      if (!list) {
        return res.status(404).json({ error: "List not found" });
      }

      if (list.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to modify this list" });
      }

      // If we're updating designer notes
      if (designerId !== undefined && notes !== undefined) {
        await db
          .update(listDesigners)
          .set({ notes })
          .where(
            and(
              eq(listDesigners.listId, listId),
              eq(listDesigners.designerId, designerId)
            )
          );

        const updatedList = await db.query.lists.findFirst({
          where: eq(lists.id, listId),
          with: {
            designers: {
              with: {
                designer: true,
              },
            },
          },
        });

        return res.json(updatedList);
      }

      // Otherwise, update list details
      const [updatedList] = await db
        .update(lists)
        .set({
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(summary !== undefined && { summary }),
          ...(isPublic !== undefined && { isPublic }),
        })
        .where(eq(lists.id, listId))
        .returning();

      res.json(updatedList);
    } catch (err) {
      console.error('Error updating list:', err);
      res.status(500).json({ error: "Failed to update list" });
    }
  }));

  // Delete list route
  app.delete("/api/lists/:listId", withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const listId = parseInt(req.params.listId);

      // Verify the list exists and belongs to the user
      const list = await db.query.lists.findFirst({
        where: eq(lists.id, listId),
      });

      if (!list) {
        return res.status(404).json({ error: "List not found" });
      }

      if (list.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to delete this list" });
      }

      // Delete the list (list_designers will be automatically deleted due to ON DELETE CASCADE)
      const [deletedList] = await db
        .delete(lists)
        .where(eq(lists.id, listId))
        .returning();

      res.json({ message: "List deleted successfully", list: deletedList });
    } catch (err) {
      console.error('Error deleting list:', err);
      res.status(500).json({ error: "Failed to delete list" });
    }
  }));

  app.post("/api/lists/:listId/designers", withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const listId = parseInt(req.params.listId);
      const { designerId } = req.body;

      // Verify the list exists and belongs to the user
      const list = await db.query.lists.findFirst({
        where: eq(lists.id, listId),
      });

      if (!list) {
        return res.status(404).json({ error: "List not found" });
      }

      if (list.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to modify this list" });
      }

      // Check if the designer exists
      const designer = await db.query.designers.findFirst({
        where: eq(designers.id, designerId),
      });

      if (!designer) {
        return res.status(404).json({ error: "Designer not found" });
      }

      // Check if the designer is already in the list
      const existingEntry = await db.query.listDesigners.findFirst({
        where: and(
          eq(listDesigners.listId, listId),
          eq(listDesigners.designerId, designerId)
        ),
      });

      if (existingEntry) {
        return res.status(400).json({ error: "Designer already in list" });
      }

      // Add the designer to the list
      const [listDesigner] = await db
        .insert(listDesigners)
        .values({
          listId,
          designerId,
        })
        .returning();

      res.json(listDesigner);
    } catch (err) {
      console.error('Error adding designer to list:', err);
      res.status(500).json({ error: "Failed to add designer to list" });
    }
  }));


  // Public list route
  app.get("/api/lists/:id/public", async (req, res) => {
    try {
      const listId = parseInt(req.params.id);

      const [list] = await db
        .select()
        .from(lists)
        .where(
          and(
            eq(lists.id, listId),
            eq(lists.isPublic, true)
          )
        )
        .limit(1);

      if (!list) {
        return res.status(404).send("List not found or is private");
      }

      // Get designers for the list
      const listWithDesigners = await db.query.lists.findFirst({
        where: eq(lists.id, listId),
        with: {
          designers: {
            with: {
              designer: true,
            },
          },
        },
      });

      res.json(listWithDesigners);
    } catch (err) {
      console.error('Error fetching public list:', err);
      res.status(500).json({ error: "Failed to fetch list" });
    }
  });

  // Add backup status endpoint
  app.get("/api/system/backup-status", withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    // Check if user is admin (you may want to add an admin field to your user table)
    if (!req.user.isAdmin) {
      return res.status(403).send("Not authorized");
    }

    // Get last backup time from pg_stat_archiver
    const [backupStatus] = await db.execute(sql`
      SELECT 
        last_archived_time,
        last_archived_wal,
        last_failed_time,
        last_failed_wal,
        stats_reset
      FROM pg_stat_archiver;
    `);

    res.json(backupStatus);
  }));

  // Add health check endpoint
  app.get("/api/system/health", withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).send("Not authorized");
    }

    const [healthStatus] = await db.execute(sql`
      SELECT * FROM db_health_check;
    `);

    // Add connection pool status
    const poolStatus = await db.execute(sql`
      SELECT count(*) as active_connections 
      FROM pg_stat_activity 
      WHERE state = 'active';
    `);

    res.json({
      health: healthStatus,
      connections: poolStatus[0],
      status: 'healthy'
    });
  }));

  // Add email endpoint
  app.post("/api/lists/:id/email", withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const listId = parseInt(req.params.id);
      const { email, subject, summary } = req.body;

      // Verify the list exists and belongs to the user
      const list = await db.query.lists.findFirst({
        where: eq(lists.id, listId),
        with: {
          designers: {
            with: {
              designer: true,
            },
          },
        },
      });

      if (!list) {
        return res.status(404).json({ error: "List not found" });
      }

      if (list.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to share this list" });
      }

      await sendListEmail(list, email, subject, summary);
      res.json({ message: "Email sent successfully" });
    } catch (err: any) {
      console.error('Error sending email:', err);
      res.status(500).json({ error: err.message || "Failed to send email" });
    }
  }));

  // Add route to serve images from Object Storage
  app.get('/api/images/:filename', async (req, res) => {
    const filename = req.params.filename;
    const storage = new Client();
    try {
      const file = await storage.get(filename);
      res.contentType('image/webp'); // Or other appropriate content type
      res.send(file);
    } catch (error) {
      console.error("Error fetching image:", error);
      res.status(404).send("Image not found");
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}