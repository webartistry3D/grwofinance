import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertExpenseSchema, insertCategorySchema, insertFeedbackSchema, insertIncomeSchema, insertInvoiceSchema, insertIncomeCategorySchema, insertSavingsGoalSchema, insertSavingsRecordSchema, loginSchema, registerSchema, type InsertSavingsGoal, insertTaxCalendarSchema, insertWithholdingTaxSchema, insertTaxReportSchema, insertTaxReceiptSchema, insertFirsComplianceSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import passport from "passport";
import { setupAuth, isAuthenticated, isAdmin, getCurrentUser } from "./auth";
import { onlineUsersManager } from "./online-users";
import { getUserNotifications } from "./notifications";
import websocketService from "./websocket";
import ocrService from "./ocr-service";
import { db, pool } from "./db";
import { users, expenses, income, invoices, taxCalendar, withholdingTax, taxReports, taxReceipts, firsCompliance, bankAccounts, whtTransactions } from "@shared/schema";
import { eq, and, gte, lte, count, ne, inArray, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { storageAdapter } from "./storage/index";
import { join } from "path";
import path from "path";
import fs from "fs";

// Paystack configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const upload = multer({ storage: multer.memoryStorage() });

// Helper function to get online users (users with active sessions)
async function getOnlineUsers() {
  try {
    console.log("🔍 Getting online users from sessions...");
    
    // Try a simpler query first to check if sessions table exists
    const tableCheckQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'sessions'
    `;
    
    const tableResult = await (storage as any).db.execute(tableCheckQuery);
    console.log("📊 Sessions table exists:", tableResult.rows.length > 0);
    
    if (tableResult.rows.length === 0) {
      console.log("❌ Sessions table not found");
      return new Set();
    }
    
    // Query active sessions from the sessions table
    const activeSessionsQuery = `
      SELECT sess.sid, sess.sess, sess.expire 
      FROM sessions sess
      WHERE sess.expire > NOW()
      LIMIT 10
    `;
    
    const sessionsResult = await (storage as any).db.execute(activeSessionsQuery);
    console.log("📊 Active sessions found:", sessionsResult.rows.length);
    console.log("📊 Session data:", sessionsResult.rows);
    
    // Try to extract user IDs from session data
    const onlineUserIds = new Set<string>();
    
    for (const row of sessionsResult.rows) {
      try {
        let sessionData;
        if (typeof row.sess === 'string') {
          sessionData = JSON.parse(row.sess);
        } else {
          sessionData = row.sess;
        }
        
        console.log("🔍 Session data structure:", sessionData);
        
        // Try different paths to find user ID
        const userId = sessionData?.passport?.user || 
                      sessionData?.user || 
                      sessionData?.userId;
        
        if (userId) {
          onlineUserIds.add(userId);
          console.log("✅ Found online user:", userId);
        }
      } catch (parseError) {
        console.log("❌ Error parsing session data:", parseError);
      }
    }
    
    console.log("🟢 Final online users:", Array.from(onlineUserIds));
    return onlineUserIds;
    
  } catch (error) {
    console.error("❌ Error getting online users:", error);
    return new Set();
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      const { confirmPassword, ...userData } = validatedData;

      // Password will be hashed in storage.createUser
      // const bcrypt = await import("bcrypt");
      // const hashedPassword = await bcrypt.hash(userData.password, 12);
      // userData.password = hashedPassword;

      const user = await storage.createUser(userData);

      // Auto-login after registration (only if sessions are set up)
      if (req.login) {
        req.login(user, (err) => {
          if (err) {
            console.error("Login failed after registration:", err);
            return res.status(500).json({
              message: "Registration successful but login failed",
              error: err.message,
            });
          }
          const { password: _, ...userWithoutPassword } = user;
          res.status(201).json({ user: userWithoutPassword });
        });
      } else {
        // If no sessions, just return the user
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({ user: userWithoutPassword });
      }
    } catch (error) {
      console.error("Registration failed:", error); // <--- always log
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Registration failed", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });


  app.post("/api/auth/login", (req, res, next) => {
    try {
      console.log("Login attempt:", req.body);
      loginSchema.parse(req.body);
      
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) {
          console.error("Passport error:", err);
          return res.status(500).json({ message: "Login failed" });
        }
        if (!user) {
          console.error("Authentication failed:", info);
          return res.status(401).json({ message: info?.message || "Invalid credentials" });
        }
        
        req.login(user, (err) => {
          if (err) {
            console.error("Session login error:", err);
            return res.status(500).json({ message: "Login failed" });
          }
          console.log("Session established for user:", user.email);
          res.json({ user });
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    try {
      req.logout((err) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({ message: "Logout failed" });
        }
        
        // Destroy the session
        req.session.destroy((sessionErr) => {
          if (sessionErr) {
            console.error("Session destroy error:", sessionErr);
            return res.status(500).json({ message: "Session destroy failed" });
          }
          
          // Clear all session-related cookies
          res.clearCookie('connect.sid', { 
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
          });
          
          res.json({ message: "Logged out successfully" });
        });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    console.log("User check - Session ID:", req.sessionID);
    console.log("User check - Authenticated:", req.isAuthenticated());
    console.log("User check - Current user:", getCurrentUser(req));
    res.json({ user: getCurrentUser(req) });
  });

  // Protected expense routes
  app.get("/api/expenses", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const expenses = await storage.getExpenses(userId);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  // Get expense by ID
  app.get("/api/expenses/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const expense = await storage.getExpenseById(req.params.id, userId);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expense" });
    }
  });

  // Create new expense
  app.post("/api/expenses", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      
      // Ensure Date object is a converted to a String
      const requestBody = {
        ...req.body,
        date: req.body.date
          ? new Date(req.body.date).toISOString()
          : undefined
      };
      
      const validatedData = insertExpenseSchema.parse(requestBody);
      const expense = await storage.createExpense(validatedData, userId);
      
      // Broadcast real-time update to user's connected clients
      websocketService.broadcastExpenseUpdate('created', expense, userId);
      
      // Send notification to user
      websocketService.sendNotification(userId, {
        title: "Expense Created",
        message: `New expense of ₦${expense.amount} added for ${expense.merchant}`,
        type: "success"
      });
      
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid expense data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  // Update expense
  app.patch("/api/expenses/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const updates = insertExpenseSchema.partial().parse(req.body);
      const expense = await storage.updateExpense(req.params.id, updates, userId);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      // Broadcast real-time update to user's connected clients
      websocketService.broadcastExpenseUpdate('updated', expense, userId);
      
      // Send notification to user
      websocketService.sendNotification(userId, {
        title: "Expense Updated",
        message: `Expense for ${expense.merchant} has been updated`,
        type: "info"
      });
      
      res.json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid expense data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  // Delete expense
  app.delete("/api/expenses/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      
      // Get expense details before deletion for notification
      const expense = await storage.getExpenseById(req.params.id, userId);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      const deleted = await storage.deleteExpense(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      // Broadcast real-time update to user's connected clients
      websocketService.broadcastExpenseUpdate('deleted', expense, userId);
      
      // Send notification to user
      websocketService.sendNotification(userId, {
        title: "Expense Deleted",
        message: `Expense for ${expense.merchant} (₦${expense.amount}) has been deleted`,
        type: "warning"
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Mark user as online (for HTTP polling approach)
  app.post("/api/user/online", isAuthenticated, async (req, res) => {
    try {
      const user = getCurrentUser(req);
      onlineUsersManager.markUserOnline(user.id, user.email, user.firstName, user.lastName);
      res.json({ success: true, message: "User marked as online" });
    } catch (error) {
      console.error('❌ Error marking user online:', error);
      res.status(500).json({ error: 'Failed to mark user online' });
    }
  });

  // Clean up broken image references
  app.post("/api/admin/cleanup-images", isAdmin, async (req, res) => {
    try {
      console.log("🧹 Starting image cleanup...");
      
      // Get all expenses with imageUrl
      const allExpenses = await storage.getAllExpenses();
      const expensesWithImages = allExpenses.filter(exp => exp.imageUrl);
      
      let cleanedCount = 0;
      let validCount = 0;
      
      for (const expense of expensesWithImages) {
        if (expense.imageUrl) {
          const fullPath = path.join(process.cwd(), 'uploads', 'dev', expense.imageUrl.replace('/uploads/dev/', ''));
          const fileExists = fs.existsSync(fullPath);
          
          if (!fileExists) {
            console.log(`🗑️ Removing broken image reference: ${expense.imageUrl} (Expense ID: ${expense.id})`);
            // Update expense to remove imageUrl
            await db.update(expenses)
              .set({ imageUrl: null })
              .where(eq(expenses.id, expense.id));
            cleanedCount++;
          } else {
            console.log(`✅ Valid image: ${expense.imageUrl}`);
            validCount++;
          }
        }
      }
      
      console.log(`🧹 Cleanup completed: ${cleanedCount} broken references removed, ${validCount} valid images kept`);
      
      res.json({
        message: "Image cleanup completed",
        cleanedCount,
        validCount,
        totalChecked: expensesWithImages.length
      });
    } catch (error) {
      console.error('❌ Error during image cleanup:', error);
      res.status(500).json({ error: 'Failed to cleanup images' });
    }
  });

  // Test database connection
  app.get("/api/test-db", async (req, res) => {
    try {
      console.log("🔍 Testing database connection via storage...");
      const result = await storage.getAllUsers();
      console.log("🔍 DB test result:", result);
      res.json({ success: true, count: result.length });
    } catch (error) {
      console.error("❌ DB test failed:", error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get dashboard statistics
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      // Fix week calculation to start from Monday
      const currentDay = now.getDay();
      const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1; // Sunday = 0, so 6 days since Monday
      const startOfWeek = new Date(now.getTime() - (daysSinceMonday * 24 * 60 * 60 * 1000));
      startOfWeek.setHours(0, 0, 0, 0); // Start of day

      // ✅ Incomes
      const totalIncome = await storage.getTotalIncome(userId);
      const monthlyIncome = await storage.getIncomeByDateRange(userId, startOfMonth, now);
      const weeklyIncome = await storage.getIncomeByDateRange(userId, startOfWeek, now);
      
      const totalExpenses = await storage.getTotalExpenses(userId);
      const monthlyExpenses = await storage.getExpensesByDateRange(userId, startOfMonth, now);
      const weeklyExpenses = await storage.getExpensesByDateRange(userId, startOfWeek, now);
      
      // Calculate totals including VAT from expense data
      const allExpenses = await storage.getExpenses(userId);
      const totalExpensesWithVAT = allExpenses.reduce((sum, e) => sum + parseFloat(e.amount) + (parseFloat(e.vatAmount) || 0), 0);
      const monthlyExpensesWithVAT = monthlyExpenses.reduce((sum, e) => sum + parseFloat(e.amount) + (parseFloat(e.vatAmount) || 0), 0);
      const weeklyExpensesWithVAT = weeklyExpenses.reduce((sum, e) => sum + parseFloat(e.amount) + (parseFloat(e.vatAmount) || 0), 0);
      const categoryTotals = await storage.getCategoryTotals(userId);
      const recentTransactions = (await storage.getExpenses(userId)).slice(0, 10);

      // Sums
      const monthlyExpenseTotal = monthlyExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const weeklyExpenseTotal = weeklyExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const monthlyIncomeTotal = monthlyIncome.reduce((sum, i) => sum + parseFloat(i.amount), 0);
      const weeklyIncomeTotal = weeklyIncome.reduce((sum, i) => sum + parseFloat(i.amount), 0);
      
      res.json({
        // Expenses
        totalExpenses: totalExpensesWithVAT,
        monthlyTotal: monthlyExpensesWithVAT, // Changed from monthlyIncomeTotal to match frontend
        weeklyExpenses: weeklyExpensesWithVAT,
        // Incomes
        totalIncome,
        monthlyIncome: monthlyIncomeTotal,
        weeklyIncome: weeklyIncomeTotal,
        netPosition: monthlyIncomeTotal - monthlyExpensesWithVAT,
        categoryTotals,
        receiptCount: recentTransactions.length,
        categoryCount: Object.keys(categoryTotals).length,
        recentExpenses: recentTransactions.slice(0, 3).map(e => ({
          id: e.id,
          merchant: e.merchant,
          category: e.category,
          amount: parseFloat(e.amount) + (parseFloat(e.vatAmount) || 0), // Include VAT in amount
          date: new Date(e.date).toISOString().split("T")[0], // ✅ only YYYY-MM-DD
          vatAmount: parseFloat(e.vatAmount) || 0,
          vatRate: e.vatRate || "0%"
        }))
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Category management routes
  app.get("/api/categories", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const categories = await storage.getCategories(userId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData, userId);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.updateCategory(req.params.id, validatedData, userId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const deleted = await storage.deleteCategory(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Upload receipt image with object storage
  app.post("/api/upload-receipt", isAuthenticated, upload.single('receipt'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = getCurrentUser(req).id;
      
      // Save image to storage and get the URL
      const storageResult = await storageAdapter.upload(req.file.buffer, req.file.originalname, req.file.mimetype, userId);

      if (!storageResult || !storageResult.url) {
        throw new Error('Failed to upload image to storage');
      }

      console.log(`✅ Image uploaded successfully: ${storageResult.url}`);
      console.log(`🔍 Full file path: ${join(process.cwd(), 'uploads', 'dev', storageResult.key)}`);
      console.log(`🔍 Static route should serve: /uploads/dev/${storageResult.key}`);
      
      // Return only the image URL, not an expense record
      const responseObj = { 
        imageUrl: storageResult.url,
        message: "Receipt uploaded successfully"
      };
      
      console.log("📸 Upload route returning:", responseObj);
      
      res.json(responseObj);
    } catch (error) {
      console.error('❌ Error uploading receipt:', error);
      res.status(500).json({ message: "Failed to upload receipt" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const allExpenses = await storage.getAllExpenses();
      
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const activeUsers = allUsers.filter(u => u.isActive).length;
      const paidUsers = allUsers.filter(u => u.subscriptionPlan === 'premium').length;
      const newUsersThisMonth = allUsers.filter(u => 
        u.createdAt && new Date(u.createdAt) >= startOfMonth
      ).length;
      
      const totalExpenses = allExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const averageSpending = allUsers.length > 0 ? totalExpenses / allUsers.length : 0;

      res.json({
        totalUsers: allUsers.length,
        activeUsers,
        paidUsers,
        totalExpenses,
        monthlyRevenue: 0, // Placeholder for actual revenue calculation
        newUsersThisMonth,
        averageSpending,
      });
    } catch (error) {
      console.error("Error getting admin stats:", error);
      res.status(500).json({ message: "Failed to get admin stats" });
    }
  });

  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      console.log("🔍 Admin users API called with real-time tracking");
      const allUsers = await storage.getAllUsers();
      const allExpenses = await storage.getAllExpenses();
      
      // Get online users from real-time manager
      const onlineUsers = onlineUsersManager.getOnlineUsers();
      const onlineUserIds = onlineUsers.map(user => user.id);
      console.log("🟢 Real-time online users:", onlineUsers.length);
      
      // Get current user ID from session for fallback
      const currentUserId = (req as any).user?.id;
      console.log("👤 Current admin user ID:", currentUserId);

      const usersWithStats = allUsers.map(user => {
        const userExpenses = allExpenses.filter(e => e.userId === user.id);
        const totalExpenses = userExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        
        const { password: _, ...userWithoutPassword } = user;
        let isOnline = onlineUserIds.includes(user.id);
        
        // Fallback: If user is current authenticated user, mark as online
        if (!isOnline && user.id === currentUserId) {
          isOnline = true;
          console.log(`🔄 Fallback: Current user ${user.email} marked as online`);
        }
        
        console.log(`👤 User ${user.email}: isOnline=${isOnline}, userId=${user.id}`);
        
        return {
          ...userWithoutPassword,
          totalExpenses,
          isOnline, // Real-time online status
          lastActivity: userExpenses.length > 0 
            ? new Date(Math.max(...userExpenses.map(e => new Date(e.date).getTime()))).toISOString()
            : null,
        };
      });

      console.log("📤 Returning users with real-time online status");
      res.json(usersWithStats);
    } catch (error) {
      console.error("❌ Error getting admin users:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.patch("/api/admin/users/:id/status", isAdmin, async (req, res) => {
    try {
      const { isActive } = req.body;
      const user = await storage.updateUser(req.params.id, { isActive });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User status updated successfully" });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  app.patch("/api/admin/users/:id/admin", isAdmin, async (req, res) => {
    try {
      const { isAdmin: makeAdmin } = req.body;
      const user = await storage.updateUser(req.params.id, { isAdmin: makeAdmin });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "Admin status updated successfully" });
    } catch (error) {
      console.error("Error updating admin status:", error);
      res.status(500).json({ message: "Failed to update admin status" });
    }
  });

  app.patch("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const { isActive, isAdmin: makeAdmin } = req.body;
      const updates: any = {};
      
      if (typeof isActive === 'boolean') updates.isActive = isActive;
      if (typeof makeAdmin === 'boolean') updates.isAdmin = makeAdmin;
      
      const user = await storage.updateUser(req.params.id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Test database connection
  app.get("/api/test-db", async (req, res) => {
    try {
      console.log("🔍 Testing database connection via storage...");
      const result = await storage.getAllUsers();
      console.log("🔍 DB test result:", result);
      res.json({ success: true, count: result.length });
    } catch (error) {
      console.error("❌ DB test failed:", error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // System health check
  app.get("/api/admin/system-health", isAdmin, async (req, res) => {
    try {
      console.log("🏥 System health check requested");
      const startTime = Date.now();
      
      // Database health check
      let dbHealth = { status: 'unknown' as 'healthy' | 'unhealthy', responseTime: 0, error: null as string | null };
      try {
        const dbStartTime = Date.now();
        const result = await storage.getAllUsers();
        dbHealth.responseTime = Date.now() - dbStartTime;
        dbHealth.status = 'healthy';
        console.log("✅ Database health check passed");
      } catch (error) {
        dbHealth.status = 'unhealthy';
        dbHealth.error = error instanceof Error ? error.message : 'Unknown database error';
        console.log("❌ Database health check failed:", dbHealth.error);
      }

      // Storage health check
      let storageHealth = { status: 'unknown' as 'healthy' | 'unhealthy', responseTime: 0, error: null as string | null };
      try {
        const storageStartTime = Date.now();
        // Simple storage check - try to access a basic storage method
        await storage.getAllUsers();
        storageHealth.responseTime = Date.now() - storageStartTime;
        storageHealth.status = 'healthy';
        console.log("✅ Storage health check passed");
      } catch (error) {
        storageHealth.status = 'unhealthy';
        storageHealth.error = error instanceof Error ? error.message : 'Unknown storage error';
        console.log("❌ Storage health check failed:", storageHealth.error);
      }

      // Memory usage
      const memUsage = process.memoryUsage();
      const memoryInfo = {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
      };

      // CPU usage
      const cpuUsage = process.cpuUsage();

      // Uptime
      const uptime = {
        seconds: Math.floor(process.uptime()),
        human: formatUptime(process.uptime())
      };

      // Active users
      const onlineUsers = onlineUsersManager.getOnlineUsers();
      const activeUsers = {
        count: onlineUsers.length,
        list: onlineUsers.map(u => `${u.firstName || ''} ${u.lastName || ''} (${u.email})`.trim() || u.email)
      };
      
      // Debug: Log what we're sending
      console.log("🔍 Sending activeUsers data:", JSON.stringify(activeUsers, null, 2));

      // Database statistics
      let dbStats = { users: 0, expenses: 0, income: 0, invoices: 0 };
      try {
        const allUsers = await storage.getAllUsers();
        const allExpenses = await storage.getAllExpenses();
        const allIncome = await storage.getAllIncome();
        const allInvoices = await storage.getAllInvoices();
        
        dbStats = {
          users: allUsers.length,
          expenses: allExpenses.length,
          income: allIncome.length,
          invoices: allInvoices.length
        };
        console.log("✅ Database stats completed:", dbStats);
      } catch (error) {
        console.error('❌ Error fetching database stats:', error);
      }

      // System info
      const systemInfo = {
        platform: process.platform,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid,
      };

      // API response time
      const apiResponseTime = Date.now() - startTime;

      // Overall health status
      const overallHealth = {
        status: (dbHealth.status === 'healthy' && storageHealth.status === 'healthy') ? 'healthy' : 'degraded',
        score: calculateHealthScore(dbHealth, storageHealth, memoryInfo),
        lastChecked: new Date().toISOString()
      };

      const healthReport = {
        overall: overallHealth,
        database: dbHealth,
        storage: storageHealth,
        memory: memoryInfo,
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        uptime,
        activeUsers,
        databaseStats: dbStats,
        systemInfo,
        performance: {
          apiResponseTime,
          memoryUsagePercent: Math.round((memoryInfo.heapUsed / memoryInfo.heapTotal) * 100)
        }
      };

      console.log("✅ System health check completed successfully");
      res.json(healthReport);
    } catch (error) {
      console.error('System health check failed:', error);
      res.status(500).json({
        error: 'System health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Helper functions
  function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  function calculateHealthScore(dbHealth: any, storageHealth: any, memoryInfo: any): number {
    let score = 100;
    
    if (dbHealth.status !== 'healthy') score -= 40;
    if (storageHealth.status !== 'healthy') score -= 30;
    
    // Memory usage penalty
    const memoryUsagePercent = (memoryInfo.heapUsed / memoryInfo.heapTotal) * 100;
    if (memoryUsagePercent > 90) score -= 30;
    else if (memoryUsagePercent > 80) score -= 20;
    else if (memoryUsagePercent > 70) score -= 10;
    
    return Math.max(0, score);
  }

  // Income management routes
  app.get("/api/income", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const income = await storage.getIncome(userId);
      console.log("Income records for user", userId, ":", income);
      res.json(income);
    } catch (error) {
      console.error("Get income error:", error);
      res.status(500).json({ message: "Failed to fetch income" });
    }
  });

  app.post("/api/income", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const validatedData = insertIncomeSchema.parse(req.body);
      const income = await storage.createIncome(validatedData, userId);
      res.status(201).json(income);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create income error:", error);
      res.status(500).json({ message: "Failed to create income" });
    }
  });

  app.put("/api/income/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const validatedData = insertIncomeSchema.parse(req.body);
      const income = await storage.updateIncome(req.params.id, validatedData, userId);
      if (!income) {
        return res.status(404).json({ message: "Income not found" });
      }
      res.json(income);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Update income error:", error);
      res.status(500).json({ message: "Failed to update income" });
    }
  });

  // Invoice management routes
  app.get("/api/invoices", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const invoices = await storage.getInvoices(userId);
      
      // Check and update overdue invoices
      const updatedInvoices = invoices.map(invoice => {
        const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
        
        // Update status to overdue if:
        // 1. Due date has passed
        // 2. Current status is 'sent' (not paid, partially_paid, or draft)
        // 3. Not already overdue
        if (dueDate && dueDate < today && invoice.status === 'sent') {
          console.log(`Marking invoice ${invoice.invoiceNumber} as overdue. Due: ${invoice.dueDate}, Today: ${today.toISOString()}`);
          // Update the invoice status to overdue
          storage.updateInvoice(invoice.id, { status: 'overdue' }, userId).catch(error => {
            console.error(`Failed to update invoice ${invoice.invoiceNumber} to overdue:`, error);
          });
          return { ...invoice, status: 'overdue' };
        }
        
        return invoice;
      });
      
      res.json(updatedInvoices);
    } catch (error) {
      console.error("Get invoices error:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.post("/api/invoices", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const validatedData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(validatedData, userId);
      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create invoice error:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.put("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      
      // Create a partial schema for updates - only allow updating specific fields
      const updateInvoiceSchema = z.object({
        clientName: z.string().min(1).optional(),
        clientEmail: z.string().email().nullable().optional(),
        clientPhone: z.string().nullable().optional(),
        clientAddress: z.string().nullable().optional(),
        amount: z.string().optional(),
        description: z.string().optional(),
        dueDate: z.string().or(z.date()).transform((val) => typeof val === 'string' ? new Date(val) : val).optional(),
        issueDate: z.string().or(z.date()).transform((val) => typeof val === 'string' ? new Date(val) : val).optional(),
        paymentTerms: z.string().optional(),
        status: z.enum(["draft", "sent", "paid", "partially_paid", "overdue"]).optional(),
        amountPaid: z.string().optional(),
      });
      
      const validatedData = updateInvoiceSchema.parse(req.body);
      console.log('Updating invoice:', req.params.id, 'with data:', validatedData, 'for user:', userId);
      const invoice = await storage.updateInvoice(req.params.id, validatedData, userId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      console.log('Invoice updated successfully:', invoice);
      res.json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Update invoice error:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  app.patch("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const updates = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, updates, userId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Patch invoice error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  app.get("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      console.log("Fetching invoice:", req.params.id, "for user:", userId);
      const invoice = await storage.getInvoiceById(req.params.id, userId);
      console.log("Invoice found:", !!invoice);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Get invoice error:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.delete("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const invoiceId = req.params.id;
      console.log(`🚀 Delete invoice request:`, { invoiceId, userId });
      
      const deleted = await storage.deleteInvoice(invoiceId, userId);
      console.log(`📋 Storage deleteInvoice result:`, { invoiceId, deleted, rowCount: deleted });
      
      if (!deleted) {
        console.log(`❌ Invoice not found:`, { invoiceId, userId });
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      console.log(`✅ Invoice deleted successfully:`, { invoiceId, userId });
      res.status(200).json({ success: true, message: "Invoice deleted successfully" });
    } catch (error) {
      console.error("❌ Delete invoice error:", error);
      
      // Handle partial invoice deletion blocked error
      if (error instanceof Error && error.message === 'PARTIAL_INVOICE_DELETE_BLOCKED') {
        const relatedInvoice = (error as any).relatedInvoice;
        console.log(`🚫 Partial invoice deletion blocked, suggesting full invoice deletion:`, relatedInvoice);
        
        return res.status(400).json({ 
          error: "PARTIAL_INVOICE_DELETE_BLOCKED",
          message: "Cannot delete partial invoice. Please delete the full payment invoice first.",
          relatedInvoice: relatedInvoice,
          suggestion: `Delete invoice ${relatedInvoice.invoiceNumber} to remove all related partial invoices`
        });
      }
      
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // New endpoint for cascade deletion of full payment invoices
  app.delete("/api/invoices/:id/cascade", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const invoiceId = req.params.id;
      console.log(`🚀 Cascade delete invoice request:`, { invoiceId, userId });
      
      const deleted = await storage.deleteFullInvoiceAndRelated(invoiceId, userId);
      console.log(`📋 Storage deleteFullInvoiceAndRelated result:`, { invoiceId, deleted, rowCount: deleted });
      
      if (!deleted) {
        console.log(`❌ Invoice not found for cascade deletion:`, { invoiceId, userId });
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      console.log(`✅ Invoice and related partial invoices deleted successfully:`, { invoiceId, userId });
      res.status(200).json({ 
        success: true, 
        message: "Full payment invoice and all related partial invoices deleted successfully" 
      });
    } catch (error) {
      console.error("❌ Cascade delete invoice error:", error);
      res.status(500).json({ message: "Failed to delete invoice and related records" });
    }
  });

  // Income categories routes
  app.get("/api/income-categories", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const categories = await storage.getIncomeCategories(userId);
      res.json(categories);
    } catch (error) {
      console.error("Get income categories error:", error);
      res.status(500).json({ message: "Failed to fetch income categories" });
    }
  });

  app.post("/api/income-categories", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const validatedData = insertIncomeCategorySchema.parse(req.body);
      const category = await storage.createIncomeCategory(validatedData, userId);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create income category error:", error);
      res.status(500).json({ message: "Failed to create income category" });
    }
  });

  // User settings routes
  app.get("/api/user/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      console.log("Fetching settings for user:", userId);

      // Get user settings
      const settings = await storage.getUserSettings(userId) || {};
      console.log("User settings:", settings);

      // Get user's savings goals
      const goals = await storage.getSavingsGoals(userId);
      console.log("Savings goals:", goals);

      // Attach to settings
      const response = {
        ...settings,
        savingsGoal: goals, // or pick only one if needed
      };
      console.log("Final response:", response);

      res.json(response);
    } catch (error) {
      console.error("Get user settings error:", error);
      res.status(500).json({ message: "Failed to fetch user settings" });
    }
  });


  {/*app.put("/api/user/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const settings = await storage.updateUserSettings(userId, req.body);
      res.json(settings);
    } catch (error) {
      console.error("Update user settings error:", error);
      res.status(500).json({ message: "Failed to update user settings" });
    }
  });*/}

  // Debug endpoint to list all income records
  app.get("/api/income/debug", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const allIncome = await storage.getIncome(userId);
      console.log("Debug: All income records for user", userId, ":", allIncome);
      res.json(allIncome);
    } catch (error) {
      console.error("Debug income error:", error);
      res.status(500).json({ message: "Failed to fetch debug income data" });
    }
  });

  // Cleanup stale income records
  app.post("/api/income/cleanup", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const allIncome = await storage.getIncome(userId);
      
      // Valid IDs from database
      const validIds = [
        "48174189-77f8-495b-b186-249d8df533f8",
        "1a2d6706-e990-4139-80aa-92543a406d36", 
        "0fe1d0cf-4b68-4fae-b878-0d7d416ae93c"
      ];
      
      // Find stale records (not in valid list)
      const staleRecords = allIncome.filter(record => !validIds.includes(record.id));
      
      console.log("Found stale records to delete:", staleRecords);
      
      // Delete stale records
      let deletedCount = 0;
      for (const record of staleRecords) {
        const deleted = await storage.deleteIncome(record.id, userId);
        if (deleted) {
          deletedCount++;
          console.log(`Deleted stale record: ${record.id}`);
        }
      }
      
      res.json({ 
        message: `Cleaned up ${deletedCount} stale income records`,
        deletedCount,
        staleRecords: staleRecords.map(r => ({ id: r.id, description: r.description }))
      });
    } catch (error) {
      console.error("Cleanup income error:", error);
      res.status(500).json({ message: "Failed to cleanup income records" });
    }
  });

  // Income dashboard stats
  app.get("/api/income/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Start of current week (Monday)
      const startOfWeek = new Date(now);
      const dayOfWeek = now.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so 6 days back to Monday
      startOfWeek.setDate(now.getDate() - daysFromMonday);
      startOfWeek.setHours(0, 0, 0, 0);
      
      console.log("Week calculation:", { now: now.toISOString(), startOfWeek: startOfWeek.toISOString() });
      
      const totalIncome = await storage.getTotalIncome(userId);
      const monthlyIncome = await storage.getIncomeByDateRange(userId, startOfMonth, now);
      const weeklyIncome = await storage.getIncomeByDateRange(userId, startOfWeek, now);
      const allIncome = await storage.getIncome(userId);
      const recentIncome = (await storage.getIncome(userId)).slice(0, 5);
      const pendingInvoices = await storage.getPendingInvoices(userId);
      
      console.log("Income data:", { 
        weeklyIncomeCount: weeklyIncome.length, 
        monthlyIncomeCount: monthlyIncome.length,
        totalIncomeValue: totalIncome
      });
      
      const monthlyTotal = monthlyIncome.reduce((sum, income) => sum + parseFloat(income.amount), 0);
      const weeklyTotal = weeklyIncome.reduce((sum, income) => sum + parseFloat(income.amount), 0);
      
      res.json({
        totalIncome,
        monthlyTotal,
        weeklyTotal,
        pendingInvoices: pendingInvoices.length,
        invoicesCreated: allIncome.length,   // 👈 added
        recentPayments: recentIncome.map(income => ({
          id: income.id,
          source: income.source,
          amount: parseFloat(income.amount),
          //date: income.date,
          date: new Date(income.date).toISOString().split("T")[0], // ✅ only YYYY-MM-DD
          status: income.status
        }))
      });
    } catch (error) {
      console.error("Income stats error:", error);
      res.status(500).json({ message: "Failed to fetch income stats" });
    }
  });

  // Subscription management endpoints
  app.get("/api/subscription/info", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUserById(getCurrentUser(req).id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // For canceled subscriptions, show freemium plan details
      const displayPlan = user.subscriptionStatus === "canceled" ? "freemium" : user.subscriptionPlan;
      const displayEndDate = user.subscriptionStatus === "canceled" ? null : user.subscriptionEndDate;
      const scansLimit = displayPlan === "premium" ? -1 : 10;
      
      // Check if subscription is expiring soon (within 7 days)
      let isExpiringSoon = false;
      if (user.subscriptionEndDate && user.subscriptionStatus === "active") {
        const expiryDate = new Date(user.subscriptionEndDate);
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        isExpiringSoon = expiryDate <= sevenDaysFromNow;
      }
      
      res.json({
        subscriptionPlan: displayPlan,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEndDate: displayEndDate,
        monthlyScansUsed: parseInt(user.monthlyScansUsed),
        scansLimit: scansLimit,
        lastScanResetDate: user.lastScanResetDate,
        isExpiringSoon: isExpiringSoon,
        paymentMethod: user.paystackCustomerCode ? { last4: "1234" } : null
      });
    } catch (error) {
      console.error("Error fetching subscription info:", error);
      res.status(500).json({ message: "Failed to fetch subscription info" });
    }
  });

  app.post("/api/subscription/create", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUserById(getCurrentUser(req).id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!PAYSTACK_SECRET_KEY) {
        return res.status(500).json({ message: "Payment system not configured" });
      }

      const { planType = 'yearly' } = req.body;
      
      // Set amount based on plan type
      const amount = planType === 'monthly' ? 300000 : 2880000; // ₦3,000 or ₦28,800 in kobo

      // Initialize Paystack transaction (without plan field since we don't have pre-created plans)
      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          amount: amount,
          currency: 'NGN',
          reference: `kudiscan-${user.id}-${Date.now()}`,
          callback_url: `${req.protocol}://${req.get('host')}/subscription`,
          metadata: {
            user_id: user.id,
            plan: 'premium',
            plan_type: planType,
            custom_fields: [
              {
                display_name: "User ID",
                variable_name: "user_id", 
                value: user.id
              },
              {
                display_name: "Plan Type",
                variable_name: "plan_type", 
                value: planType
              }
            ]
          }
        })
      });

      const paystackData = await paystackResponse.json();

      if (paystackData.status) {
        res.json({ 
          checkoutUrl: paystackData.data.authorization_url,
          reference: paystackData.data.reference,
          message: "Redirecting to Paystack payment..."
        });
      } else {
        throw new Error(paystackData.message || 'Paystack initialization failed');
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  app.post("/api/subscription/cancel", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUserById(getCurrentUser(req).id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.updateUser(getCurrentUser(req).id, {
        subscriptionPlan: "freemium",
        subscriptionStatus: "canceled",
        subscriptionEndDate: null,
        monthlyScansUsed: "0"
      });

      res.json({ message: "Subscription cancelled successfully" });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  // Check and enforce scan limits
  // Notifications endpoint
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const notifications = await getUserNotifications(getCurrentUser(req).id);
      res.json({ notifications, count: notifications.length });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/expenses/check-limit", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUserById(getCurrentUser(req).id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Reset monthly scans if it's a new month
      const now = new Date();
      const lastReset = new Date(user.lastScanResetDate);
      const isNewMonth = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();

      if (isNewMonth) {
        await storage.updateUser(getCurrentUser(req).id, {
          monthlyScansUsed: "0",
          lastScanResetDate: now
        });
        return res.json({ 
          canScan: true, 
          scansUsed: 0, 
          scansLimit: user.subscriptionPlan === "premium" ? -1 : 10,
          message: "Monthly scans reset"
        });
      }

      const scansUsed = parseInt(user.monthlyScansUsed);
      const scansLimit = user.subscriptionPlan === "premium" ? -1 : 10;

      if (user.subscriptionPlan === "freemium" && scansUsed >= 10) {
        return res.json({ 
          canScan: false, 
          scansUsed, 
          scansLimit: 10,
          message: "Monthly scan limit reached. Upgrade to Premium for unlimited scans."
        });
      }

      res.json({ 
        canScan: true, 
        scansUsed, 
        scansLimit,
        message: "Scan allowed"
      });
    } catch (error) {
      console.error("Error checking scan limit:", error);
      res.status(500).json({ message: "Failed to check scan limit" });
    }
  });

  app.post("/api/expenses/increment-scan", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUserById(getCurrentUser(req).id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const newScansUsed = parseInt(user.monthlyScansUsed) + 1;
      await storage.updateUser(getCurrentUser(req).id, {
        monthlyScansUsed: newScansUsed.toString()
      });

      res.json({ scansUsed: newScansUsed });
    } catch (error) {
      console.error("Error incrementing scan count:", error);
      res.status(500).json({ message: "Failed to increment scan count" });
    }
  });

  // Manual subscription activation endpoint for testing
  app.post("/api/subscription/activate", isAuthenticated, async (req, res) => {
    try {
      const { reference } = req.body;
      const userId = getCurrentUser(req).id;
      
      if (!reference) {
        return res.status(400).json({ message: "Reference required" });
      }

      // Verify payment with Paystack API
      const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      });

      const verifyData = await verifyResponse.json();

      if (verifyData.status && verifyData.data.status === 'success') {
        const { amount } = verifyData.data;
        
        // Determine plan type based on amount
        let planType, endDate;
        if (amount === 300000) { // ₦3,000 monthly
          planType = "monthly";
          endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 1 month
        } else if (amount === 2880000) { // ₦28,800 yearly
          planType = "yearly";
          endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
        } else {
          return res.status(400).json({ message: "Invalid payment amount" });
        }

        // Update user subscription
        await storage.updateUser(userId, {
          subscriptionPlan: "premium",
          subscriptionStatus: "active",
          subscriptionEndDate: endDate,
          monthlyScansUsed: "0" // Reset scans for premium user
        });

        res.json({ message: `Successfully activated ${planType} premium subscription` });
      } else {
        res.status(400).json({ message: "Payment verification failed" });
      }
    } catch (error) {
      console.error("Error activating subscription:", error);
      res.status(500).json({ message: "Failed to activate subscription" });
    }
  });

  // Paystack webhook handler for payment verification
  app.post("/api/paystack/webhook", async (req, res) => {
    try {
      const event = req.body;
      
      if (event.event === "charge.success") {
        const { reference, customer, amount } = event.data;
        
        // Extract user ID from reference
        const userIdMatch = reference.match(/kudiscan-(.+?)-\d+/);
        if (!userIdMatch) {
          console.error("Invalid reference format:", reference);
          return res.status(400).json({ message: "Invalid reference" });
        }
        
        const userId = userIdMatch[1];
        const user = await storage.getUserById(userId);
        
        if (!user) {
          console.error("User not found for reference:", reference);
          return res.status(404).json({ message: "User not found" });
        }

        // Determine plan type based on amount
        let planType, endDate;
        if (amount === 300000) { // ₦3,000 monthly
          planType = "monthly";
          endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 1 month
        } else if (amount === 2880000) { // ₦28,800 yearly
          planType = "yearly";
          endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
        } else {
          console.error("Invalid payment amount:", amount);
          return res.status(400).json({ message: "Invalid payment amount" });
        }

        // Update user subscription
        await storage.updateUser(userId, {
          subscriptionPlan: "premium",
          subscriptionStatus: "active",
          subscriptionEndDate: endDate,
          paystackCustomerCode: customer.customer_code,
          monthlyScansUsed: "0" // Reset scans for premium user
        });

        console.log(`Successfully upgraded user ${userId} to Premium (${planType} plan)`);

        console.log(`Successfully upgraded user ${userId} to Premium`);
        res.status(200).json({ message: "Webhook processed successfully" });
      } else {
        res.status(200).json({ message: "Event not handled" });
      }
    } catch (error) {
      console.error("Error processing Paystack webhook:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // Feedback routes
  app.post("/api/feedback", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const validatedData = insertFeedbackSchema.parse(req.body);
      const feedback = await storage.createFeedback(validatedData, userId);
      res.status(201).json(feedback);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Feedback submission error:", error);
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });

  app.get("/api/feedback", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const feedback = await storage.getFeedback(userId);
      res.json(feedback);
    } catch (error) {
      console.error("Feedback fetch error:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  // Admin feedback management
  app.get("/api/admin/feedback", isAdmin, async (req, res) => {
    try {
      const allFeedback = await storage.getFeedback();
      res.json(allFeedback);
    } catch (error) {
      console.error("Admin feedback fetch error:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  app.put("/api/admin/feedback/:id", isAdmin, async (req, res) => {
    try {
      const { isResolved, adminResponse } = req.body;
      const feedback = await storage.updateFeedbackStatus(
        parseInt(req.params.id), 
        isResolved, 
        adminResponse
      );
      if (!feedback) {
        return res.status(404).json({ message: "Feedback not found" });
      }
      res.json(feedback);
    } catch (error) {
      console.error("Admin feedback update error:", error);
      res.status(500).json({ message: "Failed to update feedback" });
    }
  });

  // User settings routes
  {/*
    app.get("/api/user/settings", isAuthenticated, async (req, res) => {
    try {
      const user = getCurrentUser(req);
      const userSettings = await storage.getUserSettings(user.id);
      res.json(userSettings || {});
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: "Failed to fetch user settings" });
    }
  });
  */}

  app.put("/api/user/settings", isAuthenticated, async (req, res) => {
    try {
      const user = getCurrentUser(req);
      const settings = req.body;
      
      const updatedSettings = await storage.updateUserSettings(user.id, settings);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: "Failed to update user settings" });
    }
  });

  
  // Bank accounts endpoints
  app.get("/api/bank-accounts", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      console.log("Fetching bank accounts for user:", userId);
      
      const userBankAccounts = await db.select()
        .from(bankAccounts)
        .where(eq(bankAccounts.userId, userId))
        .orderBy(bankAccounts.createdAt);
      
      console.log("Found bank accounts:", userBankAccounts.length);
      res.json(userBankAccounts);
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
      res.status(500).json({ message: "Failed to fetch bank accounts" });
    }
  });

  app.post("/api/bank-accounts", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const bankAccountData = req.body;
      
      console.log("Adding bank account for user:", userId);
      console.log("Bank account data:", bankAccountData);
      
      // If this is set as default, unset other defaults
      if (bankAccountData.isDefault) {
        await db.update(bankAccounts)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(bankAccounts.userId, userId));
      }
      
      const newBankAccount = await db.insert(bankAccounts)
        .values({
          userId,
          bankName: bankAccountData.bankName,
          accountName: bankAccountData.accountName,
          accountNumber: bankAccountData.accountNumber,
          accountType: bankAccountData.accountType || "savings",
          currency: bankAccountData.currency || "NGN",
          isDefault: bankAccountData.isDefault || false,
          includeInInvoice: bankAccountData.includeInInvoice !== false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      console.log("Bank account added:", newBankAccount[0]);
      res.status(201).json(newBankAccount[0]);
    } catch (error) {
      console.error("Error adding bank account:", error);
      res.status(500).json({ message: "Failed to add bank account" });
    }
  });

  app.put("/api/bank-accounts/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const accountId = req.params.id;
      const updateData = req.body;
      
      console.log("Updating bank account:", accountId, "for user:", userId);
      
      // Verify the bank account belongs to the user
      const existingAccount = await db.select()
        .from(bankAccounts)
        .where(and(eq(bankAccounts.id, accountId), eq(bankAccounts.userId, userId)))
        .limit(1);
      
      if (existingAccount.length === 0) {
        return res.status(404).json({ message: "Bank account not found" });
      }
      
      // If setting as default, unset other defaults first
      if (updateData.isDefault) {
        await db.update(bankAccounts)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(and(
            eq(bankAccounts.userId, userId),
            ne(bankAccounts.id, accountId) // Exclude current account
          ));
      }
      
      const updatedBankAccount = await db.update(bankAccounts)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(and(eq(bankAccounts.id, accountId), eq(bankAccounts.userId, userId)))
        .returning();
      
      console.log("Bank account updated:", updatedBankAccount[0]);
      res.json(updatedBankAccount[0]);
    } catch (error) {
      console.error("Error updating bank account:", error);
      res.status(500).json({ message: "Failed to update bank account" });
    }
  });

  // Fix multiple default bank accounts (temporary cleanup endpoint)
  app.post("/api/bank-accounts/fix-defaults", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      
      // Get all default accounts for this user
      const defaultAccounts = await db.select()
        .from(bankAccounts)
        .where(and(eq(bankAccounts.userId, userId), eq(bankAccounts.isDefault, true)));
      
      if (defaultAccounts.length <= 1) {
        return res.json({ message: "No fix needed - already has 0 or 1 default account" });
      }
      
      // Keep the first one as default, unset others
      const firstAccount = defaultAccounts[0];
      const otherAccounts = defaultAccounts.slice(1);
      
      // Unset default for other accounts
      await db.update(bankAccounts)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(and(
          eq(bankAccounts.userId, userId),
          inArray(bankAccounts.id, otherAccounts.map(acc => acc.id))
        ));
      
      res.json({ 
        message: `Fixed default accounts - kept ${firstAccount.accountName} as default, removed default from ${otherAccounts.length} other accounts`,
        keptDefault: firstAccount,
        removedDefaults: otherAccounts.length
      });
    } catch (error) {
      console.error("Error fixing default accounts:", error);
      res.status(500).json({ message: "Failed to fix default accounts" });
    }
  });

  app.delete("/api/bank-accounts/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const accountId = req.params.id;
      
      console.log("Deleting bank account:", accountId, "for user:", userId);
      
      // Verify the bank account belongs to the user
      const existingAccount = await db.select()
        .from(bankAccounts)
        .where(and(eq(bankAccounts.id, accountId), eq(bankAccounts.userId, userId)))
        .limit(1);
      
      if (existingAccount.length === 0) {
        return res.status(404).json({ message: "Bank account not found" });
      }
      
      await db.delete(bankAccounts)
        .where(and(eq(bankAccounts.id, accountId), eq(bankAccounts.userId, userId)));
      
      console.log("Bank account deleted successfully");
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting bank account:", error);
      res.status(500).json({ message: "Failed to delete bank account" });
    }
  });

  // Save net worth data endpoint
  app.post("/api/user/net-worth", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      console.log("Saving net worth data for user:", userId);
      console.log("Net worth data:", req.body);
      
      const netWorthRecord = await storage.saveNetWorthData(userId, req.body);
      console.log("Saved net worth record:", netWorthRecord);
      
      res.status(201).json(netWorthRecord);
    } catch (error) {
      console.error("Error saving net worth data:", error);
      res.status(500).json({ message: "Failed to save net worth data" });
    }
  });

  // Get net worth history endpoint
  app.get("/api/user/net-worth", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      console.log("Fetching net worth history for user:", userId);
      
      const netWorthHistory = await storage.getNetWorthHistory(userId);
      console.log("Net worth history:", netWorthHistory);
      
      res.json(netWorthHistory);
    } catch (error) {
      console.error("Error fetching net worth history:", error);
      res.status(500).json({ message: "Failed to fetch net worth history" });
    }
  });

  // Savings Goals API endpoints
  app.get("/api/savings-goals", isAuthenticated, async (req, res) => {
    try {
      const user = getCurrentUser(req);
      const goals = await storage.getSavingsGoals(user.id);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching savings goals:", error);
      res.status(500).json({ message: "Failed to fetch savings goals" });
    }
  });

  app.post("/api/savings-goals", isAuthenticated, async (req, res) => {
    try {
      console.log("Savings goal request body:", req.body);
      const user = getCurrentUser(req);
      const goalData = insertSavingsGoalSchema.parse(req.body);
      console.log("Parsed goal data:", goalData);
      
      const goal = await storage.createSavingsGoal(goalData, user.id);
      console.log("Created goal:", goal);
      res.status(201).json(goal);
    } catch (error) {
      console.error("Error creating savings goal:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create savings goal" });
    }
  });

  app.put("/api/savings-goals/:id", isAuthenticated, async (req, res) => {
    try {
      const user = getCurrentUser(req);
      const goalId = req.params.id;
      const updateData: Partial<InsertSavingsGoal> = req.body;
      
      const goal = await storage.updateSavingsGoal(goalId, updateData, user.id);
      if (!goal) {
        return res.status(404).json({ message: "Savings goal not found" });
      }
      
      res.json(goal);
    } catch (error) {
      console.error("Error updating savings goal:", error);
      res.status(500).json({ message: "Failed to update savings goal" });
    }
  });

  app.delete("/api/savings-goals/:id", isAuthenticated, async (req, res) => {
    try {
      const user = getCurrentUser(req);
      const goalId = req.params.id;
      console.log("Delete request - User ID:", user.id);
      console.log("Delete request - Goal ID:", goalId);
      
      const success = await storage.deleteSavingsGoal(goalId, user.id);
      console.log("Delete result:", success);
      
      if (!success) {
        console.log("Goal not found, returning 404");
        return res.status(404).json({ message: "Savings goal not found" });
      }
      
      console.log("Goal deleted successfully, returning 204");
      res.status(204).send();
    } catch (error) {
      console.error("Delete savings goal error:", error);
      res.status(500).json({ message: "Failed to delete savings goal" });
    }
  });

  // Savings Records API endpoints
  app.get("/api/savings", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const records = await storage.getSavingsRecords(userId);
      res.json(records);
    } catch (error) {
      console.error("Error fetching savings records:", error);
      res.status(500).json({ message: "Failed to fetch savings records" });
    }
  });

  app.post("/api/savings", isAuthenticated, async (req, res) => {
    try {
      console.log("🔧 Server: Received savings request");
      console.log("🔧 Server: Request body:", req.body);
      
      const userId = getCurrentUser(req).id;
      console.log("🔧 Server: User ID:", userId);

      // Schema will handle string to Date conversion
      console.log("🔧 Server: Parsing with schema...");
      const recordData = insertSavingsRecordSchema.parse(req.body);
      console.log("🔧 Server: Parsed record data:", recordData);

      console.log("🔧 Server: Creating record in storage...");
      const record = await storage.createSavingsRecord(recordData, userId);
      console.log("🔧 Server: Created record:", record);
      
      res.status(201).json(record);
    } catch (error) {
      console.error("❌ Server: Error in savings creation:", error);
      
      if (error instanceof z.ZodError) {
        console.error("❌ Server: Validation errors:", error.errors);
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors
        });
      }
      
      console.error("❌ Server: General error:", error);
      res.status(500).json({ message: "Failed to create savings record" });
    }
  });


  app.delete("/api/savings/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const recordId = req.params.id;
      console.log("Delete request - User ID:", userId);
      console.log("Delete request - Record ID:", recordId);
      
      const success = await storage.deleteSavingsRecord(recordId, userId);
      console.log("Delete result:", success);
      
      if (!success) {
        console.log("Record not found, returning 404");
        return res.status(404).json({ message: "Savings record not found" });
      }
      
      console.log("Record deleted successfully, returning 204");
      res.status(204).send();
    } catch (error) {
      console.error("Delete savings record error:", error);
      res.status(500).json({ message: "Failed to delete savings record" });
    }
  });

  // Delete all income records endpoint (must come before :id route)
  app.delete("/api/income/delete-all", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      console.log("🗑️ Delete all income records request - User ID:", userId);
      
      const deletedCount = await storage.deleteAllIncomeRecords(userId);
      console.log("📋 Delete all income result:", { deletedCount, userId });
      
      if (deletedCount === 0) {
        console.log("⚠️ No income records found to delete");
        return res.status(404).json({ message: "No income records found to delete" });
      }
      
      console.log(`✅ Successfully deleted ${deletedCount} income records`);
      res.status(200).json({ 
        message: "All income records deleted successfully",
        deletedCount: deletedCount
      });
    } catch (error) {
      console.error("❌ Delete all income records error:", error);
      res.status(500).json({ message: "Failed to delete all income records" });
    }
  });

  app.delete("/api/income/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const incomeId = req.params.id;
      console.log("Delete request - User ID:", userId);
      console.log("Delete request - Record ID:", incomeId);
      
      const success = await storage.deleteIncome(incomeId, userId);
      console.log("Delete result:", success);
      
      if (!success) {
        console.log("Record not found, returning 404");
        return res.status(404).json({ message: "Income record not found" });
      }
      
      console.log("Record deleted successfully, returning 204");
      res.status(204).send();
    } catch (error) {
      console.error("Delete income record error:", error);
      res.status(500).json({ message: "Failed to delete income record" });
    }
  });

  // OCR processing endpoint
  app.post("/api/ocr/process", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: "No image file provided" 
        });
      }

      const timestamp = req.body.timestamp;
      const filesize = req.body.filesize;
      
      console.log("🔍 Processing new image with server-side OCR:", {
        filename: req.file.originalname,
        size: req.file.size,
        timestamp,
        filesize,
        mimetype: req.file.mimetype
      });

      // Process the actual image content
      const result = await ocrService.processWithOCR(req.file.buffer);
      
      console.log("✅ Server-side OCR completed:", {
        success: result.success,
        confidence: result.confidence,
        processingTime: result.processingTime,
        textLength: result.text?.length || 0
      });

      // Add processing metadata to response
      res.json({
        ...result,
        processingMetadata: {
          timestamp: Date.now(),
          imageSize: req.file.size,
          filename: req.file.originalname
        }
      });
    } catch (error) {
      console.error("❌ Server-side OCR processing failed:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "OCR processing failed" 
      });
    }
  });

  // Tax Compliance Routes
  
  // Tax Calendar endpoints
  app.get("/api/tax/calendar", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const calendar = await db.select()
        .from(taxCalendar)
        .where(eq(taxCalendar.userId, userId))
        .orderBy(taxCalendar.dueDate);
      res.json(calendar);
    } catch (error) {
      console.error("Failed to fetch tax calendar:", error);
      res.status(500).json({ message: "Failed to fetch tax calendar" });
    }
  });

  app.post("/api/tax/calendar", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const validatedData = insertTaxCalendarSchema.parse(req.body);
      const result = await db.insert(taxCalendar).values({ ...validatedData, userId }).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Failed to create tax calendar entry:", error);
      res.status(500).json({ message: "Failed to create tax calendar entry" });
    }
  });

  // Update tax calendar entry status
  app.patch("/api/tax/calendar/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const calendarId = req.params.id;
      const { status } = req.body;
      
      // Validate status
      if (!['pending', 'completed', 'overdue'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'pending', 'completed', or 'overdue'" });
      }
      
      // Update the calendar entry
      const updatedCalendar = await db.update(taxCalendar)
        .set({ 
          status,
          updatedAt: new Date()
        })
        .where(and(eq(taxCalendar.id, calendarId), eq(taxCalendar.userId, userId)))
        .returning();
      
      if (updatedCalendar.length === 0) {
        return res.status(404).json({ message: "Calendar entry not found" });
      }
      
      res.json(updatedCalendar[0]);
    } catch (error) {
      console.error("Failed to update tax calendar entry:", error);
      res.status(500).json({ message: "Failed to update tax calendar entry" });
    }
  });

  // Delete tax calendar entry
  app.delete("/api/tax/calendar/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const calendarId = req.params.id;
      
      // Delete the calendar entry
      const deletedCalendar = await db.delete(taxCalendar)
        .where(and(eq(taxCalendar.id, calendarId), eq(taxCalendar.userId, userId)))
        .returning();
      
      if (deletedCalendar.length === 0) {
        return res.status(404).json({ message: "Calendar entry not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete tax calendar entry:", error);
      res.status(500).json({ message: "Failed to delete tax calendar entry" });
    }
  });

  // WHT Tracking endpoints
  app.get("/api/tax/wht", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const whtItems = await db.select()
        .from(withholdingTax)
        .where(eq(withholdingTax.userId, userId))
        .orderBy(withholdingTax.transactionDate);
      res.json(whtItems);
    } catch (error) {
      console.error("Failed to fetch WHT items:", error);
      res.status(500).json({ message: "Failed to fetch WHT items" });
    }
  });

  app.post("/api/tax/wht", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const validatedData = insertWithholdingTaxSchema.parse(req.body);
      const result = await db.insert(withholdingTax).values({ ...validatedData, userId }).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Failed to create WHT record:", error);
      res.status(500).json({ message: "Failed to create WHT record" });
    }
  });

  // Update WHT record status
  app.patch("/api/tax/wht/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const whtId = req.params.id;
      const { status, paymentDate, certificateNumber } = req.body;
      
      // Validate status
      if (!['deducted', 'remitted', 'certified'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'deducted', 'remitted', or 'certified'" });
      }
      
      // Prepare update data
      const updateData: any = { status, updatedAt: new Date() };
      if (paymentDate) updateData.paymentDate = paymentDate;
      if (certificateNumber) updateData.certificateNumber = certificateNumber;
      
      // Update the WHT record
      const updatedWHT = await db.update(withholdingTax)
        .set(updateData)
        .where(and(eq(withholdingTax.id, whtId), eq(withholdingTax.userId, userId)))
        .returning();
      
      if (updatedWHT.length === 0) {
        return res.status(404).json({ message: "WHT record not found" });
      }
      
      res.json(updatedWHT[0]);
    } catch (error) {
      console.error("Failed to update WHT record:", error);
      res.status(500).json({ message: "Failed to update WHT record" });
    }
  });

  // Delete WHT record
  app.delete("/api/tax/wht/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const whtId = req.params.id;
      
      // Delete the WHT record
      const deletedWHT = await db.delete(withholdingTax)
        .where(and(eq(withholdingTax.id, whtId), eq(withholdingTax.userId, userId)))
        .returning();
      
      if (deletedWHT.length === 0) {
        return res.status(404).json({ message: "WHT record not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete WHT record:", error);
      res.status(500).json({ message: "Failed to delete WHT record" });
    }
  });

  // Tax Reports endpoints
  app.get("/api/tax/reports", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const reports = await db.select()
        .from(taxReports)
        .where(eq(taxReports.userId, userId))
        .orderBy(taxReports.generatedDate);
      res.json(reports);
    } catch (error) {
      console.error("Failed to fetch tax reports:", error);
      res.status(500).json({ message: "Failed to fetch tax reports" });
    }
  });

  app.post("/api/tax/reports/generate", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const { reportType, reportPeriod } = req.body;
      
      // Fetch actual data for calculations
      const startDate = new Date(reportPeriod);
      const endDate = new Date(reportPeriod);
      
      // Set end date based on report type
      if (reportType.includes('monthly')) {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (reportType.includes('quarterly')) {
        endDate.setMonth(endDate.getMonth() + 3);
      } else if (reportType.includes('annual')) {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      
      // Get income data for the period
      const incomeData = await db.select()
        .from(income)
        .where(and(
          eq(income.userId, userId),
          gte(income.date, startDate),
          lte(income.date, endDate)
        ));
      
      // Get expense data for the period
      const expenseData = await db.select()
        .from(expenses)
        .where(and(
          eq(expenses.userId, userId),
          gte(expenses.date, startDate),
          lte(expenses.date, endDate)
        ));
      
      // Get WHT data for the period
      const whtData = await db.select()
        .from(withholdingTax)
        .where(and(
          eq(withholdingTax.userId, userId),
          gte(withholdingTax.transactionDate, startDate.toISOString()),
          lte(withholdingTax.transactionDate, endDate.toISOString())
        ));
      
      // Get tax receipts data
      const taxReceiptsData = await db.select()
        .from(taxReceipts)
        .where(eq(taxReceipts.userId, userId));
      
      interface ReportItem {
        type: string;
        amount: number;
      }
      
      interface ReportData {
        generatedAt: string;
        totalAmount: number;
        taxAmount: number;
        items: ReportItem[];
        [key: string]: any; // Allow additional properties
      }
      
      let reportData = {
        title: `${reportType.replace('_', ' ').toUpperCase()} - ${reportPeriod}`,
        description: `Generated tax report for ${reportPeriod}`,
        data: {
          generatedAt: new Date().toISOString(),
          totalAmount: 0,
          taxAmount: 0,
          items: [] as ReportItem[]
        } as ReportData
      };
      
      if (reportType === 'VAT_monthly') {
        // VAT calculations
        const totalIncome = incomeData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const totalExpenses = expenseData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const vatRate = 0.075; // 7.5% VAT in Nigeria
        const outputVAT = totalIncome * vatRate;
        const inputVAT = taxReceiptsData
          .filter(r => r.receiptType === 'input_vat')
          .reduce((sum, r) => sum + (parseFloat(r.taxAmount || '0') || 0), 0);
        const netVAT = outputVAT - inputVAT;
        
        reportData.data = {
          generatedAt: new Date().toISOString(),
          totalAmount: totalIncome,
          taxAmount: netVAT,
          outputVAT,
          inputVAT,
          netVAT,
          items: [
            { type: 'Total Income', amount: totalIncome },
            { type: 'Output VAT (7.5%)', amount: outputVAT },
            { type: 'Input VAT', amount: inputVAT },
            { type: 'Net VAT Payable', amount: netVAT }
          ]
        };
      } else if (reportType === 'WHT_monthly') {
        // WHT calculations
        const totalWHTDeducted = whtData.reduce((sum, item) => sum + parseFloat(item.whtAmount), 0);
        const totalWHTPaid = whtData
          .filter(w => w.status === 'remitted')
          .reduce((sum, w) => sum + parseFloat(w.whtAmount), 0);
        const outstandingWHT = totalWHTDeducted - totalWHTPaid;
        
        reportData.data = {
          generatedAt: new Date().toISOString(),
          totalAmount: whtData.reduce((sum, item) => sum + parseFloat(item.amount), 0),
          taxAmount: totalWHTDeducted,
          totalWHTDeducted,
          totalWHTPaid,
          outstandingWHT,
          items: whtData.map(w => ({
            type: 'WHT Deduction',
            deductee: w.deducteeName,
            amount: parseFloat(w.amount),
            whtRate: w.whtRate,
            whtAmount: parseFloat(w.whtAmount),
            status: w.status,
            date: w.transactionDate
          }))
        };
      } else if (reportType === 'CIT_annual') {
        // Company Income Tax calculations (simplified)
        const totalIncome = incomeData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const totalExpenses = expenseData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const deductibleExpenses = taxReceiptsData
          .filter(r => r.isDeductible)
          .reduce((sum, r) => sum + parseFloat(r.amount), 0);
        const assessableIncome = totalIncome - deductibleExpenses;
        const citRate = 0.30; // 30% CIT in Nigeria
        const citPayable = Math.max(0, assessableIncome * citRate);
        
        reportData.data = {
          generatedAt: new Date().toISOString(),
          totalAmount: totalIncome,
          taxAmount: citPayable,
          totalIncome,
          totalExpenses,
          deductibleExpenses,
          assessableIncome,
          citRate,
          citPayable,
          items: [
            { type: 'Total Income', amount: totalIncome },
            { type: 'Total Expenses', amount: totalExpenses },
            { type: 'Deductible Expenses', amount: deductibleExpenses },
            { type: 'Assessable Income', amount: assessableIncome },
            { type: 'CIT Payable (30%)', amount: citPayable }
          ]
        };
      } else if (reportType === 'tax_summary') {
        // Tax summary calculations
        const totalIncome = incomeData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const totalWHTDeducted = whtData.reduce((sum, item) => sum + parseFloat(item.whtAmount), 0);
        const totalVATCollected = taxReceiptsData
          .filter(r => r.receiptType === 'output_vat')
          .reduce((sum, r) => sum + (parseFloat(r.taxAmount || '0') || 0), 0);
        const totalVATPaid = taxReceiptsData
          .filter(r => r.receiptType === 'input_vat')
          .reduce((sum, r) => sum + (parseFloat(r.taxAmount || '0') || 0), 0);
        
        reportData.data = {
          generatedAt: new Date().toISOString(),
          totalAmount: totalIncome,
          taxAmount: totalWHTDeducted + (totalVATCollected - totalVATPaid),
          totalVATCollected,
          totalVATPaid,
          totalWHTDeducted,
          totalDeductibleExpenses: taxReceiptsData
            .filter(r => r.isDeductible)
            .reduce((sum, r) => sum + parseFloat(r.amount), 0),
          netTaxPosition: (totalVATCollected - totalVATPaid) - totalWHTDeducted,
          items: [
            { type: 'Total Income', amount: totalIncome },
            { type: 'VAT Collected', amount: totalVATCollected },
            { type: 'VAT Paid', amount: totalVATPaid },
            { type: 'WHT Deducted', amount: totalWHTDeducted },
            { type: 'Net Tax Position', amount: (totalVATCollected - totalVATPaid) - totalWHTDeducted }
          ]
        };
      }
      
      const validatedData = insertTaxReportSchema.parse(reportData);
      const result = await db.insert(taxReports).values({ 
        ...validatedData, 
        userId,
        generatedDate: new Date()
      }).returning();
      
      res.status(201).json(result[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Failed to generate tax report:", error);
      res.status(500).json({ message: "Failed to generate tax report" });
    }
  });

  // Download tax report endpoint
  app.get("/api/tax/reports/:id/download", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const reportId = req.params.id;
      
      // Fetch the report
      const reports = await db.select()
        .from(taxReports)
        .where(and(eq(taxReports.id, reportId), eq(taxReports.userId, userId)));
      
      if (reports.length === 0) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      const report = reports[0];
      
      // Update status to downloaded
      await db.update(taxReports)
        .set({ status: "downloaded" })
        .where(eq(taxReports.id, reportId));
      
      // Generate a simple PDF content (mock for now)
      const pdfContent = `
Tax Report: ${report.title}
Generated: ${new Date(report.generatedDate).toLocaleDateString()}
Period: ${report.reportPeriod}
Type: ${report.reportType}

${report.description || 'No description available'}

This is a generated tax report for compliance purposes.
      `.trim();
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="tax-report-${reportId}.pdf"`);
      res.setHeader('Content-Length', Buffer.byteLength(pdfContent, 'utf8'));
      
      res.send(pdfContent);
    } catch (error) {
      console.error("Failed to download tax report:", error);
      res.status(500).json({ message: "Failed to download tax report" });
    }
  });

  // Tax Receipts endpoints
  app.get("/api/tax/receipts", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const receipts = await db.select()
        .from(taxReceipts)
        .where(eq(taxReceipts.userId, userId))
        .orderBy(taxReceipts.date);
      res.json(receipts);
    } catch (error) {
      console.error("Failed to fetch tax receipts:", error);
      res.status(500).json({ message: "Failed to fetch tax receipts" });
    }
  });

  app.post("/api/tax/receipts", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const validatedData = insertTaxReceiptSchema.parse(req.body);
      const result = await db.insert(taxReceipts).values({ ...validatedData, userId }).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Failed to create tax receipt:", error);
      res.status(500).json({ message: "Failed to create tax receipt" });
    }
  });

  // Update tax receipt
  app.patch("/api/tax/receipts/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const receiptId = req.params.id;
      const { title, description, amount, taxAmount, category, tags, isDeductible } = req.body;
      
      // Prepare update data
      const updateData: any = { updatedAt: new Date() };
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (amount) updateData.amount = amount;
      if (taxAmount) updateData.taxAmount = taxAmount;
      if (category) updateData.category = category;
      if (tags) updateData.tags = tags;
      if (typeof isDeductible === 'boolean') updateData.isDeductible = isDeductible;
      
      // Update the tax receipt
      const updatedReceipt = await db.update(taxReceipts)
        .set(updateData)
        .where(and(eq(taxReceipts.id, receiptId), eq(taxReceipts.userId, userId)))
        .returning();
      
      if (updatedReceipt.length === 0) {
        return res.status(404).json({ message: "Tax receipt not found" });
      }
      
      res.json(updatedReceipt[0]);
    } catch (error) {
      console.error("Failed to update tax receipt:", error);
      res.status(500).json({ message: "Failed to update tax receipt" });
    }
  });

  // Delete tax receipt
  app.delete("/api/tax/receipts/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const receiptId = req.params.id;
      
      // Delete the tax receipt
      const deletedReceipt = await db.delete(taxReceipts)
        .where(and(eq(taxReceipts.id, receiptId), eq(taxReceipts.userId, userId)))
        .returning();
      
      if (deletedReceipt.length === 0) {
        return res.status(404).json({ message: "Tax receipt not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete tax receipt:", error);
      res.status(500).json({ message: "Failed to delete tax receipt" });
    }
  });

  // FIRS Compliance endpoints
  app.get("/api/tax/firs", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const compliance = await db.select()
        .from(firsCompliance)
        .where(eq(firsCompliance.userId, userId));
      
      if (compliance.length === 0) {
        // Return default compliance data if none exists
        return res.json({
          taxId: "",
          businessName: "",
          registrationNumber: "",
          taxOffice: "",
          taxCategory: "individual",
          filingFrequency: "monthly",
          lastFilingDate: null,
          nextFilingDate: null,
          complianceStatus: "pending",
          outstandingReturns: 0,
          totalTaxLiability: "0",
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      res.json(compliance[0]);
    } catch (error) {
      console.error("Failed to fetch FIRS compliance:", error);
      res.status(500).json({ message: "Failed to fetch FIRS compliance" });
    }
  });

  app.post("/api/tax/firs-compliance", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const validatedData = insertFirsComplianceSchema.parse(req.body);
      const result = await db.insert(firsCompliance).values({ ...validatedData, userId }).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Failed to create FIRS compliance:", error);
      res.status(500).json({ message: "Failed to create FIRS compliance" });
    }
  });

  // Update FIRS compliance
  app.patch("/api/tax/firs/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const firsId = req.params.id;
      const { businessName, taxId, taxOffice, taxCategory, filingFrequency, registrationNumber, lastFilingDate, nextFilingDate, complianceStatus, outstandingReturns, totalTaxLiability } = req.body;
      
      // Prepare update data
      const updateData: any = { updatedAt: new Date() };
      if (businessName) updateData.businessName = businessName;
      if (taxId) updateData.taxId = taxId;
      if (taxOffice) updateData.taxOffice = taxOffice;
      if (taxCategory) updateData.taxCategory = taxCategory;
      if (filingFrequency) updateData.filingFrequency = filingFrequency;
      if (registrationNumber) updateData.registrationNumber = registrationNumber;
      if (lastFilingDate) updateData.lastFilingDate = lastFilingDate;
      if (nextFilingDate) updateData.nextFilingDate = nextFilingDate;
      if (complianceStatus) updateData.complianceStatus = complianceStatus;
      if (outstandingReturns !== undefined) updateData.outstandingReturns = outstandingReturns;
      if (totalTaxLiability) updateData.totalTaxLiability = totalTaxLiability;
      
      // Update the FIRS compliance record
      const updatedFirs = await db.update(firsCompliance)
        .set(updateData)
        .where(and(eq(firsCompliance.id, firsId), eq(firsCompliance.userId, userId)))
        .returning();
      
      if (updatedFirs.length === 0) {
        return res.status(404).json({ message: "FIRS compliance record not found" });
      }
      
      res.json(updatedFirs[0]);
    } catch (error) {
      console.error("Failed to update FIRS compliance:", error);
      res.status(500).json({ message: "Failed to update FIRS compliance" });
    }
  });

  // Delete tax report
  app.delete("/api/tax/reports/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const reportId = req.params.id;
      
      // Delete the tax report
      const deletedReport = await db.delete(taxReports)
        .where(and(eq(taxReports.id, reportId), eq(taxReports.userId, userId)))
        .returning();
      
      if (deletedReport.length === 0) {
        return res.status(404).json({ message: "Tax report not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete tax report:", error);
      res.status(500).json({ message: "Failed to delete tax report" });
    }
  });

  // Tax Compliance Dashboard endpoint - simplified for stability
  app.get("/api/tax/compliance/dashboard", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      console.log("🔍 Fetching tax compliance dashboard for user:", userId);
      
      // Get FIRS compliance data
      const firsData = await db.select()
        .from(firsCompliance)
        .where(eq(firsCompliance.userId, userId));
      
      let complianceStatus = "pending";
      let outstandingReturns = 0;
      let totalTaxLiability = "0";
      
      if (firsData.length > 0) {
        const firsRecord = firsData[0];
        
        // Use existing FIRS data without complex calculations to avoid errors
        complianceStatus = firsRecord.complianceStatus || "pending";
        outstandingReturns = firsRecord.outstandingReturns || 0;
        totalTaxLiability = firsRecord.totalTaxLiability || "0";
        
        console.log("📊 Using existing FIRS compliance data:", { complianceStatus, outstandingReturns, totalTaxLiability });
      }
      
      const firsComplianceData = firsData.length > 0 ? firsData[0] : {
        taxId: "",
        businessName: "",
        registrationNumber: "",
        taxOffice: "",
        taxCategory: "individual",
        filingFrequency: "monthly",
        lastFilingDate: null,
        nextFilingDate: null,
        complianceStatus: "pending",
        outstandingReturns: 0,
        totalTaxLiability: "0"
      };
      
      // Simplified deadlines - avoid taxCalendar dependency for now
      const upcomingDeadlines: any[] = [];
      
      // Simplified reports - avoid taxReports dependency for now  
      const recentReports: any[] = [];
      
      // Calculate actual VAT from transactions
      let totalVATCollected = 0;
      let totalVATPaid = 0;
      
      try {
        // Get VAT collected from invoices (output VAT)
        const vatCollectedResult = await pool.query(
          `SELECT COALESCE(SUM(vat_amount), 0) as total_vat_collected 
           FROM invoices 
           WHERE user_id = $1 AND status != 'deleted'`,
          [userId]
        );
        totalVATCollected = parseFloat(vatCollectedResult.rows[0]?.total_vat_collected || '0');
        
        // Get VAT paid from expenses (input VAT)
        const vatPaidResult = await pool.query(
          `SELECT COALESCE(SUM(vat_amount), 0) as total_vat_paid 
           FROM expenses 
           WHERE user_id = $1`,
          [userId]
        );
        totalVATPaid = parseFloat(vatPaidResult.rows[0]?.total_vat_paid || '0');
        
        console.log("💰 VAT Calculations:", {
          totalVATCollected,
          totalVATPaid,
          userId
        });
      } catch (vatError) {
        console.error("❌ Error calculating VAT:", vatError);
        // Fallback to 0 if calculation fails
        totalVATCollected = 0;
        totalVATPaid = 0;
      }
      
      // Calculate actual WHT from transactions
      let totalWHTDeducted = 0;
      let totalWHTCredits = 0;
      
      try {
        // Get WHT deducted from income (WHT withheld from payments received)
        const whtDeductedResult = await pool.query(
          `SELECT COALESCE(SUM(wht_amount), 0) as total_wht_deducted 
           FROM income 
           WHERE user_id = $1 AND status != 'deleted'`,
          [userId]
        );
        totalWHTDeducted = parseFloat(whtDeductedResult.rows[0]?.total_wht_deducted || '0');
        
        // Get WHT credits from expenses (WHT paid on purchases that can be claimed)
        const whtCreditsResult = await pool.query(
          `SELECT COALESCE(SUM(wht_amount), 0) as total_wht_credits 
           FROM expenses 
           WHERE user_id = $1`,
          [userId]
        );
        totalWHTCredits = parseFloat(whtCreditsResult.rows[0]?.total_wht_credits || '0');
        
        console.log("🏛️ WHT Calculations:", {
          totalWHTDeducted,
          totalWHTCredits,
          userId
        });
      } catch (whtError) {
        console.error("❌ Error calculating WHT:", whtError);
        // Fallback to 0 if calculation fails
        totalWHTDeducted = 0;
        totalWHTCredits = 0;
      }
      
      // Calculate deductible expenses (excluding VAT and WHT amounts)
      let totalDeductibleExpenses = 0;
      
      try {
        const deductibleResult = await pool.query(
          `SELECT COALESCE(SUM(net_amount), 0) as total_deductible 
           FROM expenses 
           WHERE user_id = $1`,
          [userId]
        );
        totalDeductibleExpenses = parseFloat(deductibleResult.rows[0]?.total_deductible || '0');
        
        console.log("📊 Deductible Expenses:", {
          totalDeductibleExpenses,
          userId
        });
      } catch (expenseError) {
        console.error("❌ Error calculating deductible expenses:", expenseError);
        totalDeductibleExpenses = 0;
      }
      
      // Calculate net tax position
      const netTaxPosition = (totalVATCollected - totalVATPaid) + (totalWHTCredits - totalWHTDeducted) - totalDeductibleExpenses;
      
      // Real tax summary with actual calculations
      const taxSummary = {
        totalVATCollected,
        totalVATPaid,
        totalWHTDeducted,
        totalWHTCredits,
        totalDeductibleExpenses,
        netTaxPosition
      };
      
      console.log("📊 Sending simplified compliance data:", { 
        firsComplianceData, 
        upcomingDeadlinesCount: upcomingDeadlines.length,
        recentReportsCount: recentReports.length 
      });
      
      res.json({
        firsCompliance: firsComplianceData,
        upcomingDeadlines,
        recentReports,
        taxSummary
      });
    } catch (error) {
      console.error("Failed to fetch compliance dashboard:", error);
      res.status(500).json({ message: "Failed to fetch compliance dashboard" });
    }
  });

  
  // WHT Transactions endpoints
  app.post("/api/wht/transactions", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const whtTransaction = await storage.createWHTTransaction({ ...req.body, userId });
      res.status(201).json(whtTransaction);
    } catch (error) {
      console.error("Create WHT transaction error:", error);
      res.status(500).json({ message: "Failed to create WHT transaction" });
    }
  });

  app.get("/api/wht/transactions", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const transactions = await storage.getWHTTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Get WHT transactions error:", error);
      res.status(500).json({ message: "Failed to fetch WHT transactions" });
    }
  });

  // Update overdue invoices endpoint (can be called periodically)
  app.post("/api/invoices/update-overdue", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      const invoices = await storage.getInvoices(userId);
      
      let updatedCount = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
      
      for (const invoice of invoices) {
        const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
        
        // Update status to overdue if:
        // 1. Due date has passed
        // 2. Current status is 'sent' (not paid, partially_paid, or draft)
        // 3. Due date is not null
        if (dueDate && dueDate < today && invoice.status === 'sent') {
          await storage.updateInvoice(invoice.id, { status: 'overdue' }, userId);
          updatedCount++;
          console.log(`Updated invoice ${invoice.invoiceNumber} to overdue status`);
        }
      }
      
      res.json({ 
        message: `Updated ${updatedCount} invoices to overdue status`,
        updatedCount 
      });
    } catch (error) {
      console.error("Update overdue invoices error:", error);
      res.status(500).json({ message: "Failed to update overdue invoices" });
    }
  });

  // Tax Filings API endpoints
  app.get("/api/tax/filings", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      
      // Query tax filings from database
      // For now, return empty array as we don't have a tax_filings table yet
      const taxFilings: any[] = [];
      
      console.log("📄 Tax filings fetched for user:", userId);
      
      res.json(taxFilings);
    } catch (error) {
      console.error("Error fetching tax filings:", error);
      res.status(500).json({ message: "Failed to fetch tax filings" });
    }
  });

  app.post("/api/tax/filings", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUser(req).id;
      
      // For now, just return success without actual database storage
      // In a real implementation, you would store the filing in a tax_filings table
      console.log("📄 Tax filing submitted for user:", userId);
      console.log("Form data received:", req.body);
      
      res.json({ 
        message: "Tax filing submitted successfully",
        id: `filing_${Date.now()}`,
        status: "submitted"
      });
    } catch (error) {
      console.error("Error submitting tax filing:", error);
      res.status(500).json({ message: "Failed to submit tax filing" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
