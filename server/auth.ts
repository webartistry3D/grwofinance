import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { eq, and, gte, lte, count, ne, inArray, sql } from "drizzle-orm";
import * as schema from "@shared/schema";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import type { Express, Request, Response, NextFunction } from "express";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

// Configure Passport Local Strategy
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      console.log("Passport auth - Email:", email);
      console.log("Passport auth - Password length:", password.length);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log("Passport auth - User not found");
        return done(null, false, { message: 'Invalid email or password' });
      }

      if (!user.isActive) {
        console.log("Passport auth - User not active");
        return done(null, false, { message: 'Account is deactivated' });
      }

      console.log("Passport auth - User found, comparing password...");
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log("Passport auth - Password valid:", isValidPassword);
      
      if (!isValidPassword) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      // Don't send password to client
      const { password: _, ...userWithoutPassword } = user;
      console.log("Passport auth - Authentication successful for:", userWithoutPassword.email);
      return done(null, userWithoutPassword);
    } catch (error) {
      console.error("Passport auth - Error:", error);
      return done(error);
    }
  }
));

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUserById(id);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error, null);
  }
});

// Setup authentication middleware
export function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  
  // Configure session store inline
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  }) as any;

  app.use(session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: sessionTtl,
      path: '/',
    },
  }));
  
  app.use(passport.initialize());
  app.use(passport.session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: sessionTtl,
      path: '/',
    },
    key: 'sessionID'
  } as any));
}

// Authentication middleware
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  console.log("Auth middleware - Session ID:", req.sessionID);
  console.log("Auth middleware - Session exists:", !!req.session);
  console.log("Auth middleware - Is authenticated:", req.isAuthenticated());
  
  // Enhanced session validation
  if (!req.session || !req.sessionID) {
    console.log("Auth middleware - No valid session found");
    return res.status(401).json({ message: "No valid session" });
  }
  
  if (req.isAuthenticated()) {
    console.log("Auth middleware - User authenticated successfully");
    return next();
  }
  
  console.log("Auth middleware - Returning 401 Unauthorized");
  return res.status(401).json({ message: "Authentication required" });
};

// Admin middleware
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && (req.user as any)?.isAdmin) {
    return next();
  }
  return res.status(403).json({ message: "Admin access required" });
}

// Get current user helper
export function getCurrentUser(req: Request) {
  return req.user as any;
}