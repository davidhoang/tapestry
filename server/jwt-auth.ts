import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
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
}
