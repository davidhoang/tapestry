import { clerkClient, getAuth } from '@clerk/express';
import { type Express, Request, Response, NextFunction } from "express";
import { db } from "@db";
import { users, workspaces, workspaceMembers, type SelectUser } from "@db/schema";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export async function resolveClerkUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Set safe defaults so req.isAuthenticated() always works
  (req as any).isAuthenticated = () => false;
  (req as any).isUnauthenticated = () => true;

  const { userId: clerkUserId } = getAuth(req);

  if (!clerkUserId) {
    return next();
  }

  try {
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) {
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      const email = clerkUser.emailAddresses[0]?.emailAddress;

      if (!email) return next();

      [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (user) {
        [user] = await db
          .update(users)
          .set({ clerkId: clerkUserId })
          .where(eq(users.id, user.id))
          .returning();
      } else {
        [user] = await db
          .insert(users)
          .values({
            email,
            clerkId: clerkUserId,
            isAdmin: email === 'david@davidhoang.com',
          })
          .returning();

        const emailPrefix = email.split('@')[0];
        const workspaceName = `${emailPrefix}'s Workspace`;
        const slug = workspaceName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

        const [workspace] = await db
          .insert(workspaces)
          .values({
            name: workspaceName,
            slug,
            description: `Personal workspace for ${email}`,
            ownerId: user.id,
          })
          .returning();

        await db.insert(workspaceMembers).values({
          workspaceId: workspace.id,
          userId: user.id,
          role: 'admin',
        });
      }
    }

    req.user = user;
    (req as any).isAuthenticated = () => true;
    (req as any).isUnauthenticated = () => false;
  } catch (error) {
    console.error('Clerk user resolution error:', error);
  }

  next();
}

export function setupAuth(app: Express) {
  app.get("/api/user", (req, res) => {
    if (req.user) {
      return res.json(req.user);
    }
    res.status(401).send("Not logged in");
  });
}
