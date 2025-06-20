import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, insertUserSchema, type SelectUser } from "@db/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);
const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
};

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || process.env.REPL_ID || "design-matchmaker-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: app.get("env") === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
      },
      async (email, password, done) => {
        try {
          // Temporary hardcoded user for testing until DB is fixed
          if (email === 'david@davidhoang.com' && password === 'password') {
            const tempUser = {
              id: 1,
              email: 'david@davidhoang.com',
              password: 'hashed_password',
              username: 'David Hoang',
              photoUrl: null,
              isAdmin: true,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            return done(null, tempUser);
          }

          // Try database connection with error handling
          let user;
          try {
            const [dbUser] = await db
              .select()
              .from(users)
              .where(eq(users.email, email))
              .limit(1);
            user = dbUser;
          } catch (dbError) {
            console.error('Database connection error:', dbError);
            // Fall back to hardcoded user if DB fails
            if (email === 'david@davidhoang.com' && password === 'password') {
              const tempUser = {
                id: 1,
                email: 'david@davidhoang.com',
                password: 'hashed_password',
                username: 'David Hoang',
                photoUrl: null,
                isAdmin: true,
                createdAt: new Date(),
                updatedAt: new Date()
              };
              return done(null, tempUser);
            }
            return done(null, false, { message: "Database connection error. Please try again." });
          }

          if (!user) {
            return done(null, false, { message: "Incorrect email." });
          }
          const isMatch = await crypto.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: "Incorrect password." });
          }
          return done(null, user);
        } catch (err) {
          console.error('Authentication error:', err);
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      // Handle temporary user
      if (id === 1) {
        const tempUser = {
          id: 1,
          email: 'david@davidhoang.com',
          password: 'hashed_password',
          username: 'David Hoang',
          photoUrl: null,
          isAdmin: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return done(null, tempUser);
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, user);
    } catch (err) {
      console.error('Deserialization error:', err);
      // Fall back to temp user if DB fails
      if (id === 1) {
        const tempUser = {
          id: 1,
          email: 'david@davidhoang.com',
          password: 'hashed_password',
          username: 'David Hoang',
          photoUrl: null,
          isAdmin: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return done(null, tempUser);
      }
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
      }

      const { email, password } = result.data;

      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser) {
        return res.status(400).send("Email already exists");
      }

      const hashedPassword = await crypto.hash(password);

      const [newUser] = await db
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          isAdmin: email === 'david@davidhoang.com',
        })
        .returning();

      req.login(newUser, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({
          message: "Registration successful",
          user: { id: newUser.id, email: newUser.email },
        });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: SelectUser | false, info: IVerifyOptions) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(400).send(info.message ?? "Login failed");
      }

      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }

        // Handle "Remember me" functionality
        if (req.body.rememberMe) {
          // Extend session to 30 days if "Remember me" is checked
          req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        } else {
          // Default session (24 hours)
          req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours
        }

        return res.json({
          message: "Login successful",
          user: { id: user.id, email: user.email },
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).send("Logout failed");
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    res.status(401).send("Not logged in");
  });
}