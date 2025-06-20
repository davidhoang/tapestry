import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { designers, lists, listDesigners, conversations, messages } from "@db/schema";
import { eq, desc, and, ne, inArray, asc } from "drizzle-orm";
import { sendListEmail } from "./email";
import { enrichDesignerProfile, generateDesignerSkills, type DesignerEnrichmentData } from "./enrichment";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import express from "express";
import { sql } from "drizzle-orm";
import { Client } from "@replit/object-storage";
import OpenAI from "openai";

// Initialize Object Storage client
const objectStorage = new Client();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

// Configure multer for CSV uploads
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for CSV files
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV files are allowed.'));
    }
  },
});

// Middleware to check if user is admin
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

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

// Handle photo upload with Object Storage for persistence across deployments
const handlePhotoUpload = async (buffer: Buffer, oldFilename?: string) => {
  const filename = `uploads/${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;

  try {
    console.log('Starting photo upload process...');

    // Process image
    const processedBuffer = await sharp(buffer, {
      failOnError: false,
      limitInputPixels: 50000000
    })
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toBuffer();

    console.log('Image processed successfully, size:', processedBuffer.length);

    // Delete old file if it exists
    if (oldFilename) {
      try {
        const oldKey = oldFilename.replace('/api/uploads/', '');
        await objectStorage.delete(oldKey);
        console.log('Old file deleted successfully');
      } catch (err) {
        console.error('Failed to delete old image:', err);
        // Continue even if delete fails
      }
    }

    // Upload to Object Storage
    const uploadResult = await objectStorage.uploadFromBytes(filename, processedBuffer);
    if (uploadResult.error) {
      throw new Error(`Upload failed: ${uploadResult.error.message}`);
    }
    
    console.log('File uploaded successfully to Object Storage:', filename);

    return `/api/uploads/${filename}`;
  } catch (err) {
    console.error('File operation error:', err);
    throw new Error('Failed to process or save image');
  }
};

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Serve images from Object Storage
  app.get('/api/uploads/*', async (req, res) => {
    try {
      const key = req.path.replace('/api/uploads/', '');
      const result = await objectStorage.downloadAsBytes(key);
      
      if (result.error) {
        return res.status(404).send('Image not found');
      }
      
      res.set({
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=86400', // Cache for 1 day
        'ETag': `"${key}"`,
      });
      
      res.send(Buffer.from(result.value[0]));
    } catch (error) {
      console.error('Error serving image:', error);
      res.status(404).send('Image not found');
    }
  });

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

      // Check if email already exists within transaction (only if email is provided)
      if (designerData.email && designerData.email.trim()) {
        const existingDesigner = await tx.query.designers.findFirst({
          where: eq(designers.email, designerData.email.trim()),
        });

        if (existingDesigner) {
          throw new Error("A designer with this email address already exists. Please use a different email address.");
        }
      }

      let photoUrl;
      if (req.file?.buffer) {
        photoUrl = await handlePhotoUpload(req.file.buffer);
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
  app.get("/api/designers", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const allDesigners = await db.query.designers.findMany({
        orderBy: desc(designers.createdAt),
      });
      
      // Filter out designers with incomplete basic information
      const completeDesigners = allDesigners.filter(designer => 
        designer.name && designer.name.trim()
      );
      
      res.json(completeDesigners);
    } catch (err) {
      console.error('Error fetching designers:', err);
      res.status(500).json({ error: "Failed to fetch designers" });
    }
  });

  app.get("/api/designers/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const designerId = parseInt(req.params.id);
      const designer = await db.query.designers.findFirst({
        where: eq(designers.id, designerId),
      });
      
      if (!designer) {
        return res.status(404).json({ error: "Designer not found" });
      }
      
      res.json(designer);
    } catch (err) {
      console.error('Error fetching designer:', err);
      res.status(500).json({ error: "Failed to fetch designer" });
    }
  });

  app.put("/api/designers/:id", upload.single('photo'), withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const designerId = parseInt(req.params.id);

    let photoUrl;
    if (req.file?.buffer) {
      // Get existing designer to clean up old image
      const existingDesigner = await db.query.designers.findFirst({
        where: eq(designers.id, designerId),
      });

      const oldFilename = existingDesigner?.photoUrl?.split('/').pop();
      photoUrl = await handlePhotoUpload(req.file.buffer, oldFilename);
    }

    let designerData;
    try {
      designerData = JSON.parse(req.body.data);
    } catch (err) {
      throw new Error("Invalid designer data format");
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

  // Remove designer from list route
  app.delete("/api/lists/:listId/designers/:designerId", withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const listId = parseInt(req.params.listId);
      const designerId = parseInt(req.params.designerId);

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

      // Remove the designer from the list
      const deletedEntry = await db
        .delete(listDesigners)
        .where(
          and(
            eq(listDesigners.listId, listId),
            eq(listDesigners.designerId, designerId)
          )
        )
        .returning();

      if (deletedEntry.length === 0) {
        return res.status(404).json({ error: "Designer not found in this list" });
      }

      res.json({ message: "Designer removed from list successfully" });
    } catch (err) {
      console.error('Error removing designer from list:', err);
      res.status(500).json({ error: "Failed to remove designer from list" });
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

  // AI Matchmaker endpoint
  app.post("/api/matchmaker/analyze", withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { roleDescription } = req.body;

    if (!roleDescription || roleDescription.trim().length === 0) {
      return res.status(400).json({ error: "Role description is required" });
    }

    // Get all designers from database
    const allDesigners = await db.query.designers.findMany({
      orderBy: desc(designers.createdAt),
    });

    if (allDesigners.length === 0) {
      return res.json({ 
        recommendations: [],
        analysis: "No designers found in database to match against."
      });
    }

    // Create a summary of all designers for OpenAI
    const designerSummaries = allDesigners.map(designer => ({
      id: designer.id,
      name: designer.name,
      title: designer.title,
      company: designer.company,
      skills: designer.skills,
      bio: designer.bio,
      experience: designer.experience,
      portfolioUrl: designer.portfolioUrl
    }));

    // Use OpenAI to analyze and recommend matches
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert design recruiter and talent matcher. Your job is to analyze a role description and recommend the best designers from a given pool based on their skills, experience, and background.

          Return your response as a JSON object with this structure:
          {
            "analysis": "Brief analysis of the role requirements",
            "recommendations": [
              {
                "designerId": number,
                "matchScore": number (0-100),
                "reasoning": "Explanation of why this designer is a good match",
                "matchedSkills": ["skill1", "skill2"],
                "concerns": "Any potential concerns or gaps (optional)"
              }
            ]
          }

          Rank designers by match quality and only include those with a match score of 60 or higher. Limit to top 10 matches.`
        },
        {
          role: "user",
          content: `Role Description:
${roleDescription}

Available Designers:
${JSON.stringify(designerSummaries, null, 2)}

Please analyze this role and recommend the best matching designers.`
        }
      ],
      temperature: 0.3,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return res.status(500).json({ error: "Failed to get AI analysis" });
    }

    try {
      const analysis = JSON.parse(aiResponse);
      
      // Enrich recommendations with full designer data
      const enrichedRecommendations = analysis.recommendations.map((rec: any) => {
        const designer = allDesigners.find(d => d.id === rec.designerId);
        return {
          ...rec,
          designer
        };
      }).filter((rec: any) => rec.designer); // Remove any recommendations where designer wasn't found

      res.json({
        analysis: analysis.analysis,
        recommendations: enrichedRecommendations,
        roleDescription
      });
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      res.status(500).json({ error: "Failed to parse AI analysis" });
    }
  }));

  // Chat-based conversation API endpoints
  app.post("/api/conversations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { title } = req.body;
      
      const [conversation] = await db.insert(conversations).values({
        userId: req.user.id,
        title: title || "New Conversation",
      }).returning();

      res.json(conversation);
    } catch (error: any) {
      console.error("Create conversation error:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.get("/api/conversations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const userConversations = await db.query.conversations.findMany({
        where: eq(conversations.userId, req.user.id),
        orderBy: [desc(conversations.updatedAt)],
        with: {
          messages: {
            orderBy: [asc(messages.createdAt)],
            limit: 1
          }
        }
      });

      res.json(userConversations);
    } catch (error: any) {
      console.error("Get conversations error:", error);
      res.status(500).json({ error: "Failed to get conversations" });
    }
  });

  app.get("/api/conversations/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const conversationId = parseInt(req.params.id);
      
      const conversation = await db.query.conversations.findFirst({
        where: and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, req.user.id)
        ),
        with: {
          messages: {
            orderBy: [asc(messages.createdAt)]
          }
        }
      });

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      res.json(conversation);
    } catch (error: any) {
      console.error("Get conversation error:", error);
      res.status(500).json({ error: "Failed to get conversation" });
    }
  });

  app.post("/api/conversations/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: "Message content is required" });
      }

      const conversation = await db.query.conversations.findFirst({
        where: and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, req.user.id)
        ),
        with: {
          messages: {
            orderBy: [asc(messages.createdAt)]
          }
        }
      });

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      await db.insert(messages).values({
        conversationId,
        role: "user",
        content,
      });

      const designersData = await db.query.designers.findMany({
        where: eq(designers.userId, req.user.id),
      });

      if (designersData.length === 0) {
        const assistantMessage = await db.insert(messages).values({
          conversationId,
          role: "assistant",
          content: "I don't see any designers in your database yet. Would you like to add some designers first so I can help you find matches?",
        }).returning();

        return res.json({
          message: assistantMessage[0],
          recommendations: []
        });
      }

      const conversationHistory = conversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      conversationHistory.push({ role: "user", content });

      const designersForAI = designersData.map(d => ({
        id: d.id,
        name: d.name,
        title: d.title,
        company: d.company,
        skills: d.skills,
        bio: d.bio,
        experience: d.experience,
        location: d.location,
        availability: d.availability,
        rate: d.rate
      }));

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: `You are an expert design recruiter and talent matcher having a conversation with a client. Your job is to help them find the perfect designers through an interactive chat.

Key behaviors:
1. Ask follow-up questions to better understand their needs
2. Provide designer matches when you have enough information
3. Refine matches based on their feedback
4. Be conversational and helpful
5. When providing matches, always include match scores and reasoning

Available designers database:
${JSON.stringify(designersForAI, null, 2)}

When you provide matches, respond with your message AND append clean JSON at the end like this:
Your conversational response here.

MATCHES: {"recommendations": [{"designerId": 1, "matchScore": 85, "reasoning": "Great fit because...", "matchedSkills": ["UI Design", "Figma"], "concerns": null}]}

IMPORTANT: Ensure the JSON after MATCHES: is valid and clean - no code blocks, no extra characters.
If you're asking questions or don't have enough info yet, don't include the MATCHES section.` 
          },
          ...conversationHistory
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error("No response from AI");
      }

      let recommendations = [];
      let responseContent = aiResponse;
      
      const matchesIndex = aiResponse.indexOf("MATCHES:");
      if (matchesIndex !== -1) {
        const matchesJson = aiResponse.substring(matchesIndex + 8).trim();
        responseContent = aiResponse.substring(0, matchesIndex).trim();
        
        try {
          const cleanJson = matchesJson.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
          console.log("Attempting to parse JSON:", cleanJson);
          
          const parsedMatches = JSON.parse(cleanJson);
          
          if (parsedMatches.recommendations && Array.isArray(parsedMatches.recommendations)) {
            recommendations = parsedMatches.recommendations
              .map((rec: any) => {
                const designer = designersData.find(d => d.id === rec.designerId);
                if (!designer) return null;
                
                return {
                  ...rec,
                  designer
                };
              })
              .filter(Boolean)
              .sort((a: any, b: any) => b.matchScore - a.matchScore);
          }
        } catch (parseError) {
          console.error("Failed to parse matches:", parseError, "Raw JSON:", matchesJson);
        }
      }

      const [assistantMessage] = await db.insert(messages).values({
        conversationId,
        role: "assistant",
        content: responseContent,
        recommendations: recommendations.length > 0 ? recommendations : null,
      }).returning();

      await db.update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));

      res.json({
        message: assistantMessage,
        recommendations
      });

    } catch (error: any) {
      console.error("Chat message error:", error);
      res.status(500).json({ 
        error: "Failed to process message",
        details: error.message 
      });
    }
  });

  // Admin API routes
  app.get("/api/admin/db/tables", withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).send("Not authorized");
    }

    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    // Drizzle returns a QueryResult object with rows property
    const tables = result.rows || result;
    res.json(tables);
  }));

  app.post("/api/admin/db/query", withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).send("Not authorized");
    }

    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: "Query is required and must be a string" 
      });
    }

    // Basic safety checks - prevent destructive operations without explicit confirmation
    const lowerQuery = query.toLowerCase().trim();
    const destructiveKeywords = ['drop', 'truncate', 'delete from users', 'delete from designers', 'delete from lists'];
    
    const isDestructive = destructiveKeywords.some(keyword => 
      lowerQuery.includes(keyword)
    );

    if (isDestructive && !req.body.confirmDestructive) {
      return res.status(400).json({
        success: false,
        error: "Destructive operation detected. This query could delete or modify data. Please review carefully."
      });
    }

    try {
      const result = await db.execute(sql.raw(query));
      
      // Extract rows from the result object
      const data = result.rows || result;
      
      res.json({
        success: true,
        data: Array.isArray(data) ? data : [data],
        rowCount: Array.isArray(data) ? data.length : (data ? 1 : 0)
      });
    } catch (error: any) {
      res.json({
        success: false,
        error: error.message || "Query execution failed"
      });
    }
  }));

  // Profile enrichment endpoints
  app.post("/api/designers/:id/enrich", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    try {
      const { id } = req.params;
      
      // Get existing designer data
      const designer = await db.query.designers.findFirst({
        where: and(eq(designers.id, parseInt(id)), eq(designers.userId, req.user!.id))
      });

      if (!designer) {
        return res.status(404).json({ error: "Designer not found" });
      }

      // Prepare existing data for enrichment
      const existingData = {
        name: designer.name,
        title: designer.title || undefined,
        company: designer.company || undefined,
        bio: designer.bio || undefined,
        experience: designer.experience || undefined,
        skills: designer.skills || undefined,
        portfolioUrl: designer.portfolioUrl || undefined,
        email: designer.email || undefined,
        phone: designer.phone || undefined,
        location: designer.location || undefined,
        availability: designer.availability || undefined,
        rate: designer.rate || undefined
      };

      // Enrich the profile
      const enrichmentResult = await enrichDesignerProfile(designer.name, existingData);

      if (!enrichmentResult.success) {
        return res.status(500).json({ error: enrichmentResult.error });
      }

      res.json(enrichmentResult);
    } catch (error: any) {
      console.error("Profile enrichment error:", error);
      res.status(500).json({ error: error.message || "Failed to enrich profile" });
    }
  });

  app.post("/api/designers/enrich-new", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    try {
      const { name } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Designer name is required" });
      }

      // Enrich the profile for a new designer
      const enrichmentResult = await enrichDesignerProfile(name.trim());

      if (!enrichmentResult.success) {
        return res.status(500).json({ error: enrichmentResult.error });
      }

      res.json(enrichmentResult);
    } catch (error: any) {
      console.error("New profile enrichment error:", error);
      res.status(500).json({ error: error.message || "Failed to enrich profile" });
    }
  });

  app.post("/api/designers/:id/apply-enrichment", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    try {
      const { id } = req.params;
      const enrichmentData: DesignerEnrichmentData = req.body;

      // Verify designer exists and belongs to user
      const designer = await db.query.designers.findFirst({
        where: and(eq(designers.id, parseInt(id)), eq(designers.userId, req.user!.id))
      });

      if (!designer) {
        return res.status(404).json({ error: "Designer not found" });
      }

      // Apply enrichment data
      const updatedDesigner = await db.update(designers)
        .set({
          name: enrichmentData.name || designer.name,
          title: enrichmentData.title || designer.title,
          company: enrichmentData.company || designer.company,
          bio: enrichmentData.bio || designer.bio,
          experience: enrichmentData.experience || designer.experience,
          skills: enrichmentData.skills || designer.skills,
          portfolioUrl: enrichmentData.portfolioUrl || designer.portfolioUrl,
          email: enrichmentData.email || designer.email,
          phone: enrichmentData.phone || designer.phone,
          location: enrichmentData.location || designer.location,
          availability: enrichmentData.availability || designer.availability,
          rate: enrichmentData.rate || designer.rate,
          updatedAt: new Date()
        })
        .where(eq(designers.id, parseInt(id)))
        .returning();

      res.json(updatedDesigner[0]);
    } catch (error: any) {
      console.error("Apply enrichment error:", error);
      res.status(500).json({ error: error.message || "Failed to apply enrichment" });
    }
  });

  app.post("/api/designers/generate-skills", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    try {
      const { bio, experience } = req.body;

      if (!bio && !experience) {
        return res.status(400).json({ error: "Bio or experience is required" });
      }

      const skills = await generateDesignerSkills(bio || "", experience || "");
      res.json({ skills });
    } catch (error: any) {
      console.error("Skills generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate skills" });
    }
  });

  // CSV Import endpoint for admins
  app.post("/api/admin/import-designers", requireAdmin, csvUpload.single('csv'), withErrorHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: "No CSV file uploaded" 
      });
    }

    if (!req.body.mappings) {
      return res.status(400).json({ 
        success: false, 
        error: "Field mappings are required" 
      });
    }

    try {
      const csvContent = req.file.buffer.toString('utf-8');
      const mappings = JSON.parse(req.body.mappings);
      
      // Parse CSV content
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: "CSV file is empty" 
        });
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataRows = lines.slice(1);

      const results = {
        success: true,
        imported: 0,
        errors: [] as Array<{ row: number; error: string }>
      };

      // Process each row
      for (let i = 0; i < dataRows.length; i++) {
        const rowNumber = i + 2; // +2 because we skip header and array is 0-indexed
        const values = dataRows[i].split(',').map(v => v.trim().replace(/"/g, ''));
        
        try {
          const designerData: any = {
            userId: req.user.id
          };

          // Map CSV values to database fields
          mappings.forEach(({ csvColumn, dbField }: { csvColumn: string; dbField: string }) => {
            if (!dbField) return;
            
            const headerIndex = headers.indexOf(csvColumn);
            if (headerIndex === -1) return;
            
            const value = values[headerIndex] || '';
            
            if (dbField === 'skills') {
              // Parse skills as comma-separated values
              designerData.skills = value ? value.split(',').map(s => s.trim()).filter(s => s) : [];
            } else if (dbField === 'available') {
              // Parse boolean values
              designerData.available = value.toLowerCase() === 'true' || value === '1';
            } else {
              designerData[dbField] = value || null;
            }
          });

          // Validate required fields
          const requiredFields = ['name', 'title', 'email', 'level'];
          const missingFields = requiredFields.filter(field => !designerData[field]);
          
          if (missingFields.length > 0) {
            results.errors.push({
              row: rowNumber,
              error: `Missing required fields: ${missingFields.join(', ')}`
            });
            continue;
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(designerData.email)) {
            results.errors.push({
              row: rowNumber,
              error: 'Invalid email format'
            });
            continue;
          }

          // Check if email already exists
          const existingDesigner = await db.query.designers.findFirst({
            where: eq(designers.email, designerData.email)
          });

          if (existingDesigner) {
            results.errors.push({
              row: rowNumber,
              error: `Email ${designerData.email} already exists`
            });
            continue;
          }

          // Insert the designer
          await db.insert(designers).values(designerData);
          results.imported++;

        } catch (error: any) {
          results.errors.push({
            row: rowNumber,
            error: error.message || 'Failed to import row'
          });
        }
      }

      // Set success based on whether any records were imported
      results.success = results.imported > 0;
      
      if (results.errors.length > 0 && results.imported === 0) {
        results.success = false;
      }

      res.json(results);

    } catch (error: any) {
      console.error('CSV import error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process CSV file'
      });
    }
  }));

  const httpServer = createServer(app);
  return httpServer;
}