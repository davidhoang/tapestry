import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { users, designers, lists, listDesigners, conversations, messages, workspaces, workspaceMembers, workspaceInvitations, jobs } from "@db/schema";
import { eq, desc, and, ne, inArray, asc } from "drizzle-orm";
import { sendListEmail } from "./email";
import { slugify } from "./utils/slugify";
import crypto from "crypto";
import { enrichDesignerProfile, generateDesignerSkills, type DesignerEnrichmentData } from "./enrichment";
import { 
  requirePermission, 
  requireWorkspaceMembership, 
  requireRole,
  getUserWorkspaceContext,
  logPermissionAction,
  calculatePermissions,
  type WorkspaceRole 
} from "./permissions";
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

// Configure multer for PDF uploads
const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for PDF files
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF files are allowed.'));
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

  // Get user's default workspace
  const getUserWorkspace = async (userId: number) => {
    // Try to get workspace from request context first (if available)
    const member = await db.query.workspaceMembers.findFirst({
      where: eq(workspaceMembers.userId, userId),
      with: {
        workspace: true,
      },
      orderBy: [desc(workspaceMembers.joinedAt)], // Get most recent workspace
    });
    return member?.workspace || null;
  };

  // Get user's role in a workspace
  const getUserWorkspaceRole = async (userId: number, workspaceId?: number) => {
    const targetWorkspaceId = workspaceId || (await getUserWorkspace(userId))?.id;
    if (!targetWorkspaceId) return null;

    const member = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.userId, userId),
        eq(workspaceMembers.workspaceId, targetWorkspaceId)
      ),
    });
    return member?.role || null;
  };

  // Check if user has permission for specific actions
  const hasPermission = (userRole: string | null, requiredRoles: string[]) => {
    return userRole && requiredRoles.includes(userRole);
  };

  // Designer routes with workspace support
  app.post("/api/designers", upload.single('photo'), withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const userWorkspace = await getUserWorkspace(req.user.id);
    if (!userWorkspace) {
      return res.status(403).json({ error: "No workspace access" });
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

      // Check if email already exists within workspace
      if (designerData.email && designerData.email.trim()) {
        const existingDesigner = await tx.query.designers.findFirst({
          where: and(
            eq(designers.email, designerData.email.trim()),
            eq(designers.workspaceId, userWorkspace.id)
          ),
        });

        if (existingDesigner) {
          throw new Error("A designer with this email address already exists in this workspace.");
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
          workspaceId: userWorkspace.id,
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
      // Fetch all designers with skills and process in JavaScript
      const designers = await db.query.designers.findMany({
        columns: {
          skills: true,
        },
      });

      const allSkills = new Set<string>();

      designers.forEach(designer => {
        if (designer.skills) {
          // Handle both array and string formats
          if (Array.isArray(designer.skills)) {
            designer.skills.forEach(skill => {
              if (skill && typeof skill === 'string') {
                allSkills.add(skill.trim());
              }
            });
          } else if (typeof designer.skills === 'string') {
            // Handle comma-separated string format
            designer.skills.split(',').forEach(skill => {
              const trimmedSkill = skill.trim();
              if (trimmedSkill) {
                allSkills.add(trimmedSkill);
              }
            });
          }
        }
      });

      const skills = Array.from(allSkills).sort();
      res.json(skills);
    } catch (err) {
      console.error('Error fetching skills:', err);
      res.status(500).json({ error: "Failed to fetch skills" });
    }
  }));

  // Get designers in user's workspace
  app.get("/api/designers", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      let workspaceId: number | null = null;
      
      // Try to get workspace from URL headers (set by frontend)
      const workspaceSlug = req.headers['x-workspace-slug'] as string;
      console.log('GET /api/designers - received x-workspace-slug header:', workspaceSlug);
      
      if (workspaceSlug) {
        const workspace = await db.query.workspaces.findFirst({
          where: eq(workspaces.slug, workspaceSlug),
        });
        
        if (workspace) {
          workspaceId = workspace.id;
        }
      }
      
      // If no workspace slug header, fall back to user's default workspace
      if (!workspaceId) {
        const userWorkspace = await getUserWorkspace(req.user.id);
        if (userWorkspace) {
          workspaceId = userWorkspace.id;
        }
      }
      
      if (!workspaceId) {
        return res.status(403).json({ error: "No workspace access" });
      }
      
      // Verify user has access to this workspace
      const membership = await db.query.workspaceMembers.findFirst({
        where: and(
          eq(workspaceMembers.userId, req.user.id),
          eq(workspaceMembers.workspaceId, workspaceId)
        ),
      });
      
      if (!membership) {
        return res.status(403).json({ error: "Not authorized to access this workspace" });
      }

      const allDesigners = await db.query.designers.findMany({
        where: eq(designers.workspaceId, workspaceId),
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

  // Get designer by slug
  app.get("/api/designers/slug/:slug", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const { slug } = req.params;
      let workspaceId: number | null = null;
      
      // Try to get workspace from URL headers (set by frontend)
      const workspaceSlug = req.headers['x-workspace-slug'] as string;
      
      if (workspaceSlug) {
        const workspace = await db.query.workspaces.findFirst({
          where: eq(workspaces.slug, workspaceSlug),
        });
        
        if (workspace) {
          workspaceId = workspace.id;
        }
      }
      
      // If no workspace slug header, fall back to user's default workspace
      if (!workspaceId) {
        const userWorkspace = await getUserWorkspace(req.user.id);
        if (userWorkspace) {
          workspaceId = userWorkspace.id;
        }
      }
      
      if (!workspaceId) {
        return res.status(403).json({ error: "No workspace access" });
      }
      
      // Verify user has access to this workspace
      const membership = await db.query.workspaceMembers.findFirst({
        where: and(
          eq(workspaceMembers.userId, req.user.id),
          eq(workspaceMembers.workspaceId, workspaceId)
        ),
      });
      
      if (!membership) {
        return res.status(403).json({ error: "Not authorized to access this workspace" });
      }

      const designer = await db.query.designers.findFirst({
        where: and(
          eq(designers.workspaceId, workspaceId),
          sql`LOWER(REPLACE(REPLACE(${designers.name}, ' ', '-'), '.', '')) = ${slug.toLowerCase()}`
        ),
      });

      if (!designer) {
        return res.status(404).json({ error: "Designer not found" });
      }

      res.json(designer);
    } catch (err) {
      console.error('Error fetching designer by slug:', err);
      res.status(500).json({ error: "Failed to fetch designer" });
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

  app.get("/api/designers/slug/:slug", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const slug = req.params.slug;
      // Find designer by matching slugified name
      const allDesigners = await db.query.designers.findMany();
      const designer = allDesigners.find(d => slugify(d.name) === slug);
      
      if (!designer) {
        return res.status(404).json({ error: "Designer not found" });
      }
      
      res.json(designer);
    } catch (err) {
      console.error('Error fetching designer by slug:', err);
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

  // List routes with workspace support
  app.post("/api/lists", requirePermission('canCreateLists'), withErrorHandler(async (req, res) => {

    const userWorkspace = await getUserWorkspace(req.user.id);
    if (!userWorkspace) {
      return res.status(403).json({ error: "No workspace access" });
    }

    const result = await db.transaction(async (tx) => {
      const { designerIds, ...listData } = req.body;
      const [list] = await tx
        .insert(lists)
        .values({
          ...listData,
          userId: req.user.id,
          workspaceId: userWorkspace.id,
        })
        .returning();

      // If designerIds are provided, add them to the list
      if (designerIds?.length) {
        await tx.insert(listDesigners)
          .values(
            designerIds.map((designerId: number) => ({
              listId: list.id,
              designerId,
            }))
          );
      }

      return list;
    });

    res.json(result);
  }));

  app.get("/api/lists", withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = req.user as any;
    const workspaceId = parseInt(req.query.workspaceId as string) || 6; // Default to workspace 6 for testing
    
    // Get user's workspace context and permissions
    const context = await getUserWorkspaceContext(user.id, workspaceId);
    
    if (!context) {
      return res.status(403).json({ error: "Not a member of this workspace" });
    }

    const permissions = calculatePermissions(context.role);
    
    // Check if user has permission to view lists
    if (!permissions.canViewLists) {
      return res.status(403).json({ error: "Permission denied: Cannot view lists" });
    }

    const userLists = await db.query.lists.findMany({
      where: eq(lists.workspaceId, context.workspaceId),
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
  }));

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

    // Get all designers from user's workspace
    const userWorkspace = await getUserWorkspace(req.user.id);
    if (!userWorkspace) {
      return res.status(403).json({ error: "No workspace access" });
    }

    const allDesigners = await db.query.designers.findMany({
      where: eq(designers.workspaceId, userWorkspace.id),
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
      description: designer.description,
      level: designer.level,
      location: designer.location
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

  // Admin invite endpoint
  app.post("/api/admin/send-invite", withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).send("Not authorized");
    }

    const { email, message } = req.body;

    if (!email || !message) {
      return res.status(400).json({ 
        success: false, 
        error: "Email and message are required" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid email format" 
      });
    }

    try {
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email)
      });

      if (existingUser) {
        return res.status(409).json({ 
          success: false, 
          error: "User already exists" 
        });
      }

      // Get admin's workspace to invite to
      const adminWorkspace = await getUserWorkspace(req.user.id);
      if (!adminWorkspace) {
        return res.status(403).json({ 
          success: false, 
          error: "Admin has no workspace access" 
        });
      }

      // Generate invitation token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      // Create invitation record
      await db.insert(workspaceInvitations).values({
        workspaceId: adminWorkspace.id,
        email,
        role: 'member',
        token,
        invitedBy: req.user.id,
        expiresAt,
      });

      // Import sendEmail function
      const { sendEmail } = await import("./email");
      
      // Create invite link pointing to invitation page
      const inviteLink = `${req.protocol}://${req.get('host')}/invite/${token}`;
      const finalMessage = message.replace('[INVITE_LINK]', inviteLink);
      
      // Send the invite email
      await sendEmail({
        to: email,
        from: "david@davidhoang.com", // Using the same verified sender as other emails
        subject: "Invitation to Test Tapestry Alpha",
        text: finalMessage,
        html: finalMessage.replace(/\n/g, '<br>')
      });

      res.json({
        success: true,
        message: `Alpha invite successfully sent to ${email}`
      });

    } catch (error: any) {
      console.error("Invite email error:", error);
      
      // Parse SendGrid error details if available
      let errorMessage = "Failed to send invite";
      if (error.response && error.response.body && error.response.body.errors) {
        errorMessage = error.response.body.errors[0]?.message || errorMessage;
      }
      
      res.status(500).json({
        success: false,
        error: errorMessage,
        emailPreview: {
          to: email,
          subject: "Invitation to Test Tapestry Alpha",
          content: message.replace('[INVITE_LINK]', `${req.protocol}://${req.get('host')}/auth`)
        }
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
      
      // Get user workspace
      const userWorkspace = await getUserWorkspace(req.user.id);
      if (!userWorkspace) {
        return res.status(403).json({ error: "No workspace access" });
      }

      // Get existing designer data
      const designer = await db.query.designers.findFirst({
        where: and(
          eq(designers.id, parseInt(id)), 
          eq(designers.workspaceId, userWorkspace.id)
        )
      });

      if (!designer) {
        return res.status(404).json({ error: "Designer not found" });
      }

      // Prepare existing data for enrichment
      const existingData = {
        name: designer.name,
        title: designer.title || undefined,
        company: designer.company || undefined,
        bio: designer.description || undefined,
        skills: designer.skills || undefined,
        email: designer.email || undefined,
        location: designer.location || undefined
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

      // Get user workspace
      const userWorkspace = await getUserWorkspace(req.user.id);
      if (!userWorkspace) {
        return res.status(403).json({ error: "No workspace access" });
      }

      // Verify designer exists and belongs to workspace
      const designer = await db.query.designers.findFirst({
        where: and(
          eq(designers.id, parseInt(id)), 
          eq(designers.workspaceId, userWorkspace.id)
        )
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
          description: enrichmentData.bio || designer.description,
          skills: enrichmentData.skills || designer.skills,
          email: enrichmentData.email || designer.email,
          location: enrichmentData.location || designer.location
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

  // PDF processing route for LinkedIn exports
  app.post("/api/import/pdf/process", pdfUpload.single('pdf'), withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    try {
      const pdfBuffer = req.file.buffer;
      
      // Parse PDF text content
      const pdfParse = (await import("pdf-parse")).default;
      const pdfData = await pdfParse(pdfBuffer);
      const textContent = pdfData.text;
      const totalPages = pdfData.numpages;

      // Use OpenAI to extract contact information from the PDF text
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert at extracting contact information from LinkedIn export PDFs. 
            
            Your task is to parse the text content and extract individual contact profiles. Look for patterns that indicate LinkedIn profiles such as:
            - Names (usually the first line or prominently displayed)
            - Job titles and companies
            - Locations
            - LinkedIn profile URLs
            - Skills and experience information
            - Contact information (emails, phone numbers)
            
            Return a JSON array of contacts with the following structure:
            {
              "contacts": [
                {
                  "name": "Full Name",
                  "title": "Job Title",
                  "company": "Company Name",
                  "location": "City, State/Country",
                  "email": "email@example.com",
                  "linkedIn": "linkedin.com/in/profile",
                  "skills": ["skill1", "skill2", "skill3"],
                  "experience": "Brief experience summary",
                  "confidence": 0.85
                }
              ]
            }
            
            - Set confidence between 0-1 based on how complete the information is
            - Only include contacts where you have at least a name and title
            - Extract skills from job descriptions and experience sections
            - Be conservative with confidence scores - only use 0.8+ for very complete profiles
            - If you can't extract meaningful contact information, return an empty array`
          },
          {
            role: "user",
            content: `Please extract contact information from this LinkedIn export PDF content:\n\n${textContent}`
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error("No response from AI");
      }

      let extractedContacts = [];
      let errors: string[] = [];

      try {
        // Clean the response to extract JSON
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          const parsed = JSON.parse(jsonStr);
          extractedContacts = parsed.contacts || [];
        } else {
          throw new Error("No valid JSON found in response");
        }
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        errors.push("Failed to parse extracted contact information");
      }

      // Validate and clean contacts
      const validContacts = extractedContacts
        .filter((contact: any) => contact.name && contact.title)
        .map((contact: any) => ({
          name: contact.name.trim(),
          title: contact.title?.trim() || '',
          company: contact.company?.trim() || null,
          location: contact.location?.trim() || null,
          email: contact.email?.trim() || null,
          linkedIn: contact.linkedIn?.trim() || null,
          skills: Array.isArray(contact.skills) ? contact.skills.slice(0, 10) : [],
          experience: contact.experience?.trim() || null,
          confidence: Math.min(Math.max(contact.confidence || 0.5, 0), 1)
        }));

      const result = {
        success: validContacts.length > 0 || errors.length === 0,
        contacts: validContacts,
        totalPages,
        errors: errors.length > 0 ? errors : undefined,
        message: validContacts.length === 0 ? "No contacts could be extracted from the PDF" : undefined
      };

      res.json(result);

    } catch (error: any) {
      console.error('PDF processing error:', error);
      res.status(500).json({ 
        error: "Failed to process PDF file",
        details: error.message 
      });
    }
  }));

  // PDF import route - imports processed contacts into database
  app.post("/api/import/pdf/import", withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const userWorkspace = await getUserWorkspace(req.user.id);
    if (!userWorkspace) {
      return res.status(403).json({ error: "No workspace access" });
    }

    const { contacts } = req.body;

    if (!contacts || !Array.isArray(contacts)) {
      return res.status(400).json({ error: "Invalid contacts data" });
    }

    try {
      const results = {
        success: true,
        imported: 0,
        skipped: 0,
        errors: [] as Array<{ contact: string; error: string }>,
      };

      for (const contact of contacts) {
        try {
          // Check if designer already exists by email or name+company
          let existingDesigner = null;
          
          if (contact.email) {
            existingDesigner = await db.query.designers.findFirst({
              where: and(
                eq(designers.email, contact.email),
                eq(designers.workspaceId, userWorkspace.id)
              ),
            });
          }
          
          if (!existingDesigner && contact.name && contact.company) {
            existingDesigner = await db.query.designers.findFirst({
              where: and(
                eq(designers.name, contact.name),
                eq(designers.company, contact.company),
                eq(designers.workspaceId, userWorkspace.id)
              ),
            });
          }

          if (existingDesigner) {
            results.skipped++;
            continue;
          }

          // Determine level based on title
          let level = 'Mid-level';
          const titleLower = (contact.title || '').toLowerCase();
          if (titleLower.includes('senior') || titleLower.includes('lead') || titleLower.includes('principal')) {
            level = 'Senior';
          } else if (titleLower.includes('junior') || titleLower.includes('intern') || titleLower.includes('entry')) {
            level = 'Junior';
          } else if (titleLower.includes('director') || titleLower.includes('vp') || titleLower.includes('head')) {
            level = 'Director';
          }

          // Normalize LinkedIn URL
          const normalizeLinkedInUrl = (url: string): string => {
            if (!url || url.trim() === '') return '';
            const trimmed = url.trim();
            if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
            if (trimmed.startsWith('linkedin.com') || trimmed.startsWith('www.linkedin.com')) return `https://${trimmed}`;
            if (trimmed.startsWith('/in/')) return `https://www.linkedin.com${trimmed}`;
            if (!trimmed.includes('/') && !trimmed.includes('.')) return `https://www.linkedin.com/in/${trimmed}`;
            return `https://${trimmed}`;
          };

          // Create designer record
          const designerData = {
            name: contact.name,
            title: contact.title,
            email: contact.email || `${contact.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            level,
            company: contact.company,
            location: contact.location,
            website: null,
            linkedIn: normalizeLinkedInUrl(contact.linkedIn || ''),
            skills: contact.skills?.join(', ') || null,
            bio: contact.experience,
            available: false,
            notes: `Imported from LinkedIn PDF - Confidence: ${Math.round(contact.confidence * 100)}%`,
            userId: req.user.id,
            workspaceId: userWorkspace.id,
          };

          await db.insert(designers).values(designerData);
          results.imported++;

        } catch (error: any) {
          results.errors.push({
            contact: contact.name,
            error: error.message
          });
        }
      }

      res.json(results);

    } catch (error: any) {
      console.error('PDF import error:', error);
      res.status(500).json({ 
        error: "Failed to import contacts",
        details: error.message 
      });
    }
  }));

  // Profile management routes
  app.put("/api/profile", withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const { profilePhotoUrl } = req.body;
      const userId = req.user.id;

      // Update user profile
      const [updatedUser] = await db
        .update(users)
        .set({
          ...(profilePhotoUrl !== undefined && { profilePhotoUrl }),
        })
        .where(eq(users.id, userId))
        .returning();

      res.json(updatedUser);
    } catch (error: any) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }));

  // Workspace management routes
  app.put("/api/workspaces/update", withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const { name } = req.body;
      const userId = req.user.id;

      if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: "Workspace name must be at least 2 characters long" });
      }

      // Get user's workspace
      const userWorkspace = await getUserWorkspace(userId);
      if (!userWorkspace) {
        return res.status(403).json({ error: "No workspace access" });
      }

      // Check if user is owner or admin of the workspace
      const membership = await db.query.workspaceMembers.findFirst({
        where: and(
          eq(workspaceMembers.workspaceId, userWorkspace.id),
          eq(workspaceMembers.userId, userId)
        ),
      });

      if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
        return res.status(403).json({ error: "Not authorized to update workspace" });
      }

      // Update workspace name
      const [updatedWorkspace] = await db
        .update(workspaces)
        .set({
          name: name.trim(),
        })
        .where(eq(workspaces.id, userWorkspace.id))
        .returning();

      res.json(updatedWorkspace);
    } catch (error: any) {
      console.error("Workspace update error:", error);
      res.status(500).json({ error: "Failed to update workspace" });
    }
  }));

  app.post("/api/profile/photo", upload.single('photo'), withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    if (!req.file?.buffer) {
      return res.status(400).json({ error: "No photo file provided" });
    }

    try {
      const userId = req.user.id;

      // Get existing user to clean up old profile photo
      const existingUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      const oldFilename = existingUser?.profilePhotoUrl;
      const photoUrl = await handlePhotoUpload(req.file.buffer, oldFilename);

      // Update user's profile photo URL
      const [updatedUser] = await db
        .update(users)
        .set({
          profilePhotoUrl: photoUrl,
        })
        .where(eq(users.id, userId))
        .returning();

      res.json({ profilePhotoUrl: updatedUser.profilePhotoUrl });
    } catch (error: any) {
      console.error("Profile photo upload error:", error);
      res.status(500).json({ error: "Failed to upload profile photo" });
    }
  }));

  // Onboarding API endpoints
  app.get("/api/onboarding/state", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.user.id),
        columns: {
          hasCompletedOnboarding: true,
          onboardingDebugMode: true,
          isAdmin: true,
        }
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        debugMode: user.isAdmin ? user.onboardingDebugMode : false,
      });
    } catch (error: any) {
      console.error('Failed to fetch onboarding state:', error);
      res.status(500).json({ error: "Failed to fetch onboarding state" });
    }
  });

  app.post("/api/onboarding/complete", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      await db.update(users)
        .set({ hasCompletedOnboarding: true })
        .where(eq(users.id, req.user.id));

      res.json({ success: true });
    } catch (error: any) {
      console.error('Failed to complete onboarding:', error);
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  });

  app.put("/api/onboarding/settings", requireAdmin, async (req, res) => {
    try {
      const { debugMode } = req.body;

      await db.update(users)
        .set({ onboardingDebugMode: debugMode })
        .where(eq(users.id, req.user.id));

      res.json({ success: true });
    } catch (error: any) {
      console.error('Failed to update onboarding settings:', error);
      res.status(500).json({ error: "Failed to update onboarding settings" });
    }
  });

  // Test email endpoint for debugging
  app.post("/api/test-email", withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    try {
      const { sendEmail } = await import("./email");
      
      await sendEmail({
        to: email,
        from: "david@davidhoang.com",
        subject: "Test Email from Tapestry",
        text: "This is a test email to verify SendGrid delivery.",
        html: "<p>This is a test email to verify SendGrid delivery.</p>"
      });

      res.json({ success: true, message: "Test email sent successfully" });
    } catch (error: any) {
      console.error('Test email failed:', error);
      res.status(500).json({ 
        error: "Failed to send test email", 
        details: error.message 
      });
    }
  }));

  // Workspace member management routes
  app.get("/api/workspaces/:workspaceId/members", requireWorkspaceMembership(), withErrorHandler(async (req, res) => {
    const { workspaceId } = req.params;
    const context = (req as any).workspaceContext;
    const permissions = (req as any).permissions;

    if (!permissions.canViewMembersList) {
      return res.status(403).json({ error: "Not authorized to view members list" });
    }

    const members = await db.query.workspaceMembers.findMany({
      where: eq(workspaceMembers.workspaceId, parseInt(workspaceId)),
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            username: true,
            profilePhotoUrl: true,
            createdAt: true,
          }
        },
      },
      orderBy: [
        sql`CASE WHEN ${workspaceMembers.role} = 'owner' THEN 1 
                 WHEN ${workspaceMembers.role} = 'admin' THEN 2 
                 WHEN ${workspaceMembers.role} = 'member' THEN 3 
                 WHEN ${workspaceMembers.role} = 'viewer' THEN 4 
                 ELSE 5 END`,
        asc(workspaceMembers.joinedAt)
      ],
    });

    await logPermissionAction({
      userId: context.userId,
      workspaceId: parseInt(workspaceId),
      action: 'view_members',
      resource: 'workspace_members',
    });

    res.json(members.map(member => ({
      id: member.id,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
      user: member.user,
    })));
  }));

  app.patch("/api/workspaces/:workspaceId/members/:memberId/role", requirePermission('canChangeRoles'), withErrorHandler(async (req, res) => {
    const { workspaceId, memberId } = req.params;
    const { role } = req.body;
    const context = (req as any).workspaceContext;

    if (!['owner', 'admin', 'member', 'viewer'].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Can't change owner role
    const targetMember = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, parseInt(workspaceId)),
        eq(workspaceMembers.id, parseInt(memberId))
      ),
    });

    if (!targetMember) {
      return res.status(404).json({ error: "Member not found" });
    }

    if (targetMember.role === 'owner' && role !== 'owner') {
      return res.status(400).json({ error: "Cannot change owner role" });
    }

    // Can't promote someone to owner unless you are owner
    if (role === 'owner' && !context.isOwner) {
      return res.status(403).json({ error: "Only owners can promote to owner" });
    }

    const [updatedMember] = await db
      .update(workspaceMembers)
      .set({ role })
      .where(eq(workspaceMembers.id, parseInt(memberId)))
      .returning();

    await logPermissionAction({
      userId: context.userId,
      workspaceId: parseInt(workspaceId),
      action: 'change_role',
      resource: 'workspace_member',
      resourceId: parseInt(memberId),
      metadata: { oldRole: targetMember.role, newRole: role },
    });

    res.json(updatedMember);
  }));

  app.delete("/api/workspaces/:workspaceId/members/:memberId", requirePermission('canRemoveMembers'), withErrorHandler(async (req, res) => {
    const { workspaceId, memberId } = req.params;
    const context = (req as any).workspaceContext;

    // Can't remove owner
    const targetMember = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, parseInt(workspaceId)),
        eq(workspaceMembers.id, parseInt(memberId))
      ),
    });

    if (!targetMember) {
      return res.status(404).json({ error: "Member not found" });
    }

    if (targetMember.role === 'owner') {
      return res.status(400).json({ error: "Cannot remove workspace owner" });
    }

    // Can't remove yourself unless transferring ownership
    if (targetMember.userId === context.userId) {
      return res.status(400).json({ error: "Cannot remove yourself from workspace" });
    }

    await db
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.id, parseInt(memberId)));

    await logPermissionAction({
      userId: context.userId,
      workspaceId: parseInt(workspaceId),
      action: 'remove_member',
      resource: 'workspace_member',
      resourceId: parseInt(memberId),
      metadata: { removedRole: targetMember.role },
    });

    res.json({ success: true });
  }));

  // Leave workspace endpoint
  app.post("/api/workspaces/:workspaceId/leave", withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const workspaceId = parseInt(req.params.workspaceId);
    const userId = req.user!.id;

    // Find the user's membership in this workspace
    const membership = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId)
      ),
    });

    if (!membership) {
      return res.status(404).json({ error: "Membership not found" });
    }

    // Prevent workspace owners from leaving their own workspace
    if (membership.role === 'owner') {
      return res.status(400).json({ error: "Workspace owners cannot leave their workspace. Transfer ownership first or delete the workspace." });
    }

    // Remove the user's membership
    await db
      .delete(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId)
      ));

    await logPermissionAction({
      userId: userId,
      workspaceId: workspaceId,
      action: 'leave_workspace',
      resource: 'workspace_membership',
      metadata: { leftRole: membership.role },
    });

    res.json({ success: true, message: "Successfully left workspace" });
  }));

  app.get("/api/workspaces/:workspaceId/invitations", requirePermission('canManageInvitations'), withErrorHandler(async (req, res) => {
    const { workspaceId } = req.params;
    const context = (req as any).workspaceContext;

    const invitations = await db.query.workspaceInvitations.findMany({
      where: and(
        eq(workspaceInvitations.workspaceId, parseInt(workspaceId)),
        sql`${workspaceInvitations.acceptedAt} IS NULL`
      ),
      with: {
        inviter: {
          columns: {
            id: true,
            email: true,
            username: true,
          }
        },
      },
      orderBy: desc(workspaceInvitations.createdAt),
    });

    await logPermissionAction({
      userId: context.userId,
      workspaceId: parseInt(workspaceId),
      action: 'view_invitations',
      resource: 'workspace_invitations',
    });

    res.json(invitations.map(invitation => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      createdAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
      invitedBy: invitation.inviter,
    })));
  }));

  app.delete("/api/workspaces/:workspaceId/invitations/:invitationId", requirePermission('canManageInvitations'), withErrorHandler(async (req, res) => {
    const { workspaceId, invitationId } = req.params;
    const context = (req as any).workspaceContext;

    const invitation = await db.query.workspaceInvitations.findFirst({
      where: and(
        eq(workspaceInvitations.workspaceId, parseInt(workspaceId)),
        eq(workspaceInvitations.id, parseInt(invitationId))
      ),
    });

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    await db
      .delete(workspaceInvitations)
      .where(eq(workspaceInvitations.id, parseInt(invitationId)));

    await logPermissionAction({
      userId: context.userId,
      workspaceId: parseInt(workspaceId),
      action: 'cancel_invitation',
      resource: 'workspace_invitation',
      resourceId: parseInt(invitationId),
      metadata: { email: invitation.email, role: invitation.role },
    });

    res.json({ success: true });
  }));

  // Workspace invitation routes
  app.get("/api/invitations/:token", withErrorHandler(async (req, res) => {
    const { token } = req.params;
    
    const invitation = await db.query.workspaceInvitations.findFirst({
      where: and(
        eq(workspaceInvitations.token, token),
        sql`${workspaceInvitations.acceptedAt} IS NULL`
      ),
      with: {
        workspace: true,
        inviter: true,
      },
    });

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found or already accepted" });
    }

    if (new Date() > invitation.expiresAt) {
      return res.status(410).json({ error: "Invitation has expired" });
    }

    res.json({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      workspace: {
        id: invitation.workspace.id,
        name: invitation.workspace.name,
        description: invitation.workspace.description,
      },
      invitedBy: invitation.inviter.email,
      expiresAt: invitation.expiresAt,
    });
  }));

  app.post("/api/invitations/:token/accept", withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { token } = req.params;
    
    const invitation = await db.query.workspaceInvitations.findFirst({
      where: and(
        eq(workspaceInvitations.token, token),
        sql`${workspaceInvitations.acceptedAt} IS NULL`
      ),
      with: {
        workspace: true,
      },
    });

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found or already accepted" });
    }

    if (new Date() > invitation.expiresAt) {
      return res.status(410).json({ error: "Invitation has expired" });
    }

    // Check if user's email matches invitation
    if (req.user!.email !== invitation.email) {
      return res.status(403).json({ error: "This invitation is for a different email address" });
    }

    // Check if user is already a member of this workspace
    const existingMembership = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, invitation.workspaceId),
        eq(workspaceMembers.userId, req.user!.id)
      ),
    });

    if (existingMembership) {
      return res.status(409).json({ error: "You are already a member of this workspace" });
    }

    // Accept the invitation in a transaction
    await db.transaction(async (tx) => {
      // Add user to workspace
      await tx.insert(workspaceMembers).values({
        workspaceId: invitation.workspaceId,
        userId: req.user!.id,
        role: invitation.role,
      });

      // Mark invitation as accepted
      await tx
        .update(workspaceInvitations)
        .set({ acceptedAt: new Date() })
        .where(eq(workspaceInvitations.id, invitation.id));
    });

    res.json({ 
      success: true, 
      workspace: invitation.workspace,
      role: invitation.role,
    });
  }));

  app.post("/api/workspaces/:workspaceId/invite", withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { workspaceId } = req.params;
    const { email, role = "member" } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if user has permission to invite to this workspace
    const membership = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, parseInt(workspaceId)),
        eq(workspaceMembers.userId, req.user.id)
      ),
      with: {
        workspace: true,
      },
    });

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      return res.status(403).json({ error: "Not authorized to invite users to this workspace" });
    }

    // Check if user is already a member
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      const existingMembership = await db.query.workspaceMembers.findFirst({
        where: and(
          eq(workspaceMembers.workspaceId, parseInt(workspaceId)),
          eq(workspaceMembers.userId, existingUser.id)
        ),
      });

      if (existingMembership) {
        return res.status(409).json({ error: "User is already a member of this workspace" });
      }
    }

    // Check for existing pending invitation - if found, update expiry date instead of creating new
    const existingInvitation = await db.query.workspaceInvitations.findFirst({
      where: and(
        eq(workspaceInvitations.workspaceId, parseInt(workspaceId)),
        eq(workspaceInvitations.email, email),
        sql`${workspaceInvitations.acceptedAt} IS NULL`
      ),
    });

    let invitation;
    let token: string;
    
    if (existingInvitation) {
      // Update existing invitation with new expiry date
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7); // Expires in 7 days
      token = existingInvitation.token; // Reuse existing token
      
      [invitation] = await db
        .update(workspaceInvitations)
        .set({ 
          expiresAt: newExpiresAt,
          role: role, // Update role in case it changed
          invitedBy: req.user.id,
          createdAt: new Date() // Update created date for fresh invitation
        })
        .where(eq(workspaceInvitations.id, existingInvitation.id))
        .returning();
    } else {
      // Generate invitation token
      token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      // Create new invitation
      [invitation] = await db
        .insert(workspaceInvitations)
        .values({
          workspaceId: parseInt(workspaceId),
          email,
          role,
          token,
          invitedBy: req.user.id,
          expiresAt,
        })
        .returning();
    }

    // Send invitation email
    try {
      const { sendEmail } = await import("./email");
      const inviteLink = `${req.protocol}://${req.get('host')}/invite/${token}`;
      
      const emailContent = `You've been invited to join the workspace "${membership.workspace.name}" on Tapestry.

Click the link below to accept the invitation:
${inviteLink}

This invitation will expire on ${invitation.expiresAt.toLocaleDateString()}.

If you don't have an account yet, you'll be prompted to create one.

Best regards,
The Tapestry Team`;

      await sendEmail({
        to: email,
        from: "david@davidhoang.com",
        subject: `Invitation to join ${membership.workspace.name}`,
        text: emailContent,
        html: emailContent.replace(/\n/g, '<br>')
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({ 
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    });
  }));

  // Jobs API endpoints
  app.get("/api/jobs", withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      let workspaceId: number | null = null;
      
      // Try to get workspace from URL headers (set by frontend)
      const workspaceSlug = req.headers['x-workspace-slug'] as string;
      
      if (workspaceSlug) {
        const workspace = await db.query.workspaces.findFirst({
          where: eq(workspaces.slug, workspaceSlug),
        });
        
        if (workspace) {
          workspaceId = workspace.id;
        }
      }
      
      // If no workspace slug header, fall back to user's default workspace
      if (!workspaceId) {
        const userWorkspace = await getUserWorkspace(req.user.id);
        if (userWorkspace) {
          workspaceId = userWorkspace.id;
        }
      }
      
      if (!workspaceId) {
        return res.status(403).json({ error: "No workspace access" });
      }
      
      // Verify user has access to this workspace
      const membership = await db.query.workspaceMembers.findFirst({
        where: and(
          eq(workspaceMembers.userId, req.user.id),
          eq(workspaceMembers.workspaceId, workspaceId)
        ),
      });
      
      if (!membership) {
        return res.status(403).json({ error: "Not authorized to access this workspace" });
      }

      const userJobs = await db.query.jobs.findMany({
        where: eq(jobs.workspaceId, workspaceId),
        orderBy: desc(jobs.createdAt),
      });

      res.json(userJobs);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  }));

  app.post("/api/jobs", withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { title, description } = req.body;

      if (!title || !description) {
        return res.status(400).json({ error: "Title and description are required" });
      }

      let workspaceId: number | null = null;
      
      // Try to get workspace from URL headers (set by frontend)
      const workspaceSlug = req.headers['x-workspace-slug'] as string;
      
      if (workspaceSlug) {
        const workspace = await db.query.workspaces.findFirst({
          where: eq(workspaces.slug, workspaceSlug),
        });
        
        if (workspace) {
          workspaceId = workspace.id;
        }
      }
      
      // If no workspace slug header, fall back to user's default workspace
      if (!workspaceId) {
        const userWorkspace = await getUserWorkspace(req.user.id);
        if (userWorkspace) {
          workspaceId = userWorkspace.id;
        }
      }
      
      if (!workspaceId) {
        return res.status(403).json({ error: "No workspace access" });
      }
      
      // Verify user has access to this workspace
      const membership = await db.query.workspaceMembers.findFirst({
        where: and(
          eq(workspaceMembers.userId, req.user.id),
          eq(workspaceMembers.workspaceId, workspaceId)
        ),
      });
      
      if (!membership) {
        return res.status(403).json({ error: "Not authorized to access this workspace" });
      }

      const [newJob] = await db.insert(jobs).values({
        userId: req.user.id,
        workspaceId: workspaceId,
        title,
        description,
        status: "draft"
      }).returning();

      res.json(newJob);
    } catch (error: any) {
      console.error('Error creating job:', error);
      res.status(500).json({ error: "Failed to create job" });
    }
  }));

  app.post("/api/jobs/matches", withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: "Job ID is required" });
    }

    const userWorkspace = await getUserWorkspace(req.user.id);
    if (!userWorkspace) {
      return res.status(403).json({ error: "No workspace access" });
    }

    // Get the job
    const job = await db.query.jobs.findFirst({
      where: and(eq(jobs.id, jobId), eq(jobs.workspaceId, userWorkspace.id))
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Get all designers from user's workspace
    const allDesigners = await db.query.designers.findMany({
      where: eq(designers.workspaceId, userWorkspace.id),
      orderBy: desc(designers.createdAt),
    });

    if (allDesigners.length === 0) {
      return res.json({ 
        recommendations: [],
        analysis: "No designers found in database to match against.",
        jobId
      });
    }

    // Create a summary of all designers for OpenAI using correct field names
    const designerSummaries = allDesigners.map(designer => ({
      id: designer.id,
      name: designer.name,
      title: designer.title,
      company: designer.company,
      skills: designer.skills,
      description: designer.description,
      level: designer.level,
      location: designer.location
    }));

    // Use OpenAI to analyze and recommend matches
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert design recruiter and talent matcher. Your job is to analyze a job description and recommend the best designers from a given pool based on their skills, experience, and background.

          Return your response as a JSON object with this structure:
          {
            "analysis": "Brief analysis of the job requirements",
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
          content: `Job Title: ${job.title}

Job Description:
${job.description}

Available Designers:
${JSON.stringify(designerSummaries, null, 2)}

Please analyze this job and recommend the best matching designers.`
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
      }).filter((rec: any) => rec.designer);

      res.json({
        analysis: analysis.analysis,
        recommendations: enrichedRecommendations,
        jobId
      });
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      res.status(500).json({ error: "Failed to parse AI analysis" });
    }
  }));

  // Route to check pending invitations for an email
  app.get("/api/invitations/check/:email", withErrorHandler(async (req, res) => {
    const { email } = req.params;
    
    const pendingInvitations = await db.query.workspaceInvitations.findMany({
      where: and(
        eq(workspaceInvitations.email, decodeURIComponent(email)),
        sql`${workspaceInvitations.acceptedAt} IS NULL`
      ),
      with: {
        workspace: true,
      },
    });

    const validInvitations = pendingInvitations.filter(inv => new Date() <= inv.expiresAt);

    res.json({ invitations: validInvitations });
  }));

  // Get user's workspaces
  app.get("/api/workspaces", withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const userWorkspaces = await db.query.workspaceMembers.findMany({
      where: eq(workspaceMembers.userId, req.user.id),
      with: {
        workspace: {
          with: {
            owner: true,
          },
        },
      },
    });

    const workspacesWithDetails = userWorkspaces.map(member => ({
      id: member.workspace.id,
      name: member.workspace.name,
      slug: member.workspace.slug,
      description: member.workspace.description,
      role: member.role,
      joinedAt: member.joinedAt,
      owner: {
        id: member.workspace.owner.id,
        email: member.workspace.owner.email,
      },
    }));

    res.json(workspacesWithDetails);
  }));

  // Auto-accept pending invitations after registration
  app.post("/api/invitations/auto-accept", withErrorHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const pendingInvitations = await db.query.workspaceInvitations.findMany({
      where: and(
        eq(workspaceInvitations.email, req.user!.email),
        sql`${workspaceInvitations.acceptedAt} IS NULL`
      ),
      with: {
        workspace: true,
      },
    });

    const validInvitations = pendingInvitations.filter(inv => new Date() <= inv.expiresAt);
    
    if (validInvitations.length === 0) {
      return res.json({ acceptedCount: 0 });
    }

    let acceptedCount = 0;
    
    for (const invitation of validInvitations) {
      // Check if user is already a member of this workspace
      const existingMembership = await db.query.workspaceMembers.findFirst({
        where: and(
          eq(workspaceMembers.workspaceId, invitation.workspaceId),
          eq(workspaceMembers.userId, req.user!.id)
        ),
      });

      if (!existingMembership) {
        await db.transaction(async (tx) => {
          // Add user to workspace
          await tx.insert(workspaceMembers).values({
            workspaceId: invitation.workspaceId,
            userId: req.user!.id,
            role: invitation.role,
          });

          // Mark invitation as accepted
          await tx
            .update(workspaceInvitations)
            .set({ acceptedAt: new Date() })
            .where(eq(workspaceInvitations.id, invitation.id));
        });
        
        acceptedCount++;
      }
    }

    res.json({ acceptedCount, workspaceNames: validInvitations.map(inv => inv.workspace.name) });
  }));

  const httpServer = createServer(app);
  return httpServer;
}