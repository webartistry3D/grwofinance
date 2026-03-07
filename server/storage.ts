import type { 
  User, 
  InsertUser, 
  Category, 
  InsertCategory, 
  Expense, 
  InsertExpense, 
  Feedback, 
  InsertFeedback,
  Income,
  InsertIncome,
  Invoice,
  InvoiceWithWHT,
  InsertInvoice,
  IncomeCategory,
  InsertIncomeCategory,
  UserSettings,
  InsertUserSettings,
  SavingsGoal,
  InsertSavingsGoal,
  SavingsRecord,
  InsertSavingsRecord
} from "@shared/schema";
import { 
  users,
  expenses,
  categories,
  feedback,
  income,
  invoices,
  whtTransactions,
  incomeCategories,
  userSettings,
  savingsGoals,
  savingsRecords
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { storageAdapter } from "./storage/index";
import { join } from "path";

export interface IStorage {
  // User operations
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Expense operations
  getExpenses(userId: string): Promise<Expense[]>;
  getExpenseById(id: string, userId: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense, userId: string): Promise<Expense>;
  updateExpense(id: string, updates: Partial<InsertExpense>, userId: string): Promise<Expense | undefined>;
  deleteExpense(id: string, userId: string): Promise<boolean>;
  getExpensesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Expense[]>;
  getExpensesByCategory(userId: string, category: string): Promise<Expense[]>;
  getTotalExpenses(userId: string): Promise<number>;
  getCategoryTotals(userId: string): Promise<Record<string, number>>;
  
  // Category operations
  getCategories(userId: string): Promise<Category[]>;
  getCategoryById(id: string, userId: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory, userId: string): Promise<Category>;
  updateCategory(id: string, updates: Partial<InsertCategory>, userId: string): Promise<Category | undefined>;
  deleteCategory(id: string, userId: string): Promise<boolean>;
  
  // Feedback operations
  createFeedback(feedback: InsertFeedback, userId: string): Promise<Feedback>;
  getFeedback(userId?: string): Promise<Feedback[]>;
  updateFeedbackStatus(id: number, isResolved: boolean, adminResponse?: string): Promise<Feedback | undefined>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  getAllExpenses(): Promise<Expense[]>;
  getAllIncome(): Promise<Income[]>;
  getAllInvoices(): Promise<Invoice[]>;
  
  // Receipt processing with OCR and storage
  saveReceiptImage(file: Express.Multer.File, userId: string): Promise<Expense>;
  
  // Income operations
  getIncome(userId: string): Promise<Income[]>;
  getIncomeById(id: string, userId: string): Promise<Income | undefined>;
  createIncome(income: InsertIncome, userId: string): Promise<Income>;
  updateIncome(id: string, updates: Partial<InsertIncome>, userId: string): Promise<Income | undefined>;
  deleteIncome(id: string, userId: string): Promise<boolean>;
  deleteAllIncomeRecords(userId: string): Promise<number>;
  getIncomeByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Income[]>;
  getTotalIncome(userId: string): Promise<number>;
  
  // Invoice operations
  getInvoices(userId: string): Promise<Invoice[]>;
  getInvoiceById(id: string, userId: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice, userId: string): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<InsertInvoice>, userId: string): Promise<Invoice | undefined>;
  deleteInvoice(id: string, userId: string): Promise<boolean>;
  deleteFullInvoiceAndRelated(id: string, userId: string): Promise<boolean>;
  
  // User settings operations
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings>;
  saveNetWorthData(userId: string, netWorthData: any): Promise<any>;
  getNetWorthHistory(userId: string): Promise<any[]>;
  getPendingInvoices(userId: string): Promise<Invoice[]>;
  
  // Savings goals operations
  getSavingsGoals(userId: string): Promise<SavingsGoal[]>;
  getSavingsGoalById(id: string, userId: string): Promise<SavingsGoal | undefined>;
  createSavingsGoal(goal: InsertSavingsGoal, userId: string): Promise<SavingsGoal>;
  updateSavingsGoal(id: string, updates: Partial<InsertSavingsGoal>, userId: string): Promise<SavingsGoal | undefined>;
  deleteSavingsGoal(id: string, userId: string): Promise<boolean>;
  
  // Savings records operations
  getSavingsRecords(userId: string): Promise<SavingsRecord[]>;
  createSavingsRecord(record: InsertSavingsRecord, userId: string): Promise<SavingsRecord>;
  deleteSavingsRecord(id: string, userId: string): Promise<boolean>;
  
  // Income category operations
  getIncomeCategories(userId: string): Promise<IncomeCategory[]>;
  getIncomeCategoryById(id: string, userId: string): Promise<IncomeCategory | undefined>;
  createIncomeCategory(category: InsertIncomeCategory, userId: string): Promise<IncomeCategory>;
  updateIncomeCategory(id: string, updates: Partial<InsertIncomeCategory>, userId: string): Promise<IncomeCategory | undefined>;
  deleteIncomeCategory(id: string, userId: string): Promise<boolean>;

}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    console.log("Storage getUserByEmail - Looking for:", email);
    const [user] = await db.select().from(users).where(eq(users.email, email));
    console.log("Storage getUserByEmail - Found user:", user ? `ID: ${user.id}, Email: ${user.email}` : 'None');
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const updateData = { ...updates };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }
    
    const [user] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Expense operations
  async getExpenses(userId: string): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(eq(expenses.userId, userId))
      .orderBy(expenses.createdAt);
  }

  async getExpenseById(id: string, userId: string): Promise<Expense | undefined> {
    const [expense] = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
    return expense;
  }

  async createExpense(insertExpense: InsertExpense, userId: string): Promise<Expense> {
    const [expense] = await db
      .insert(expenses)
      .values({
        ...insertExpense,
        userId,
      })
      .returning();
    return expense;
  }

  async updateExpense(id: string, updates: Partial<InsertExpense>, userId: string): Promise<Expense | undefined> {
    const [expense] = await db
      .update(expenses)
      .set(updates)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning();
    return expense;
  }

  async deleteExpense(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getExpensesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.date, startDate),
          lte(expenses.date, endDate)
        )
      );
  }

  async getExpensesByCategory(userId: string, category: string): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.userId, userId), eq(expenses.category, category)));
  }

  async getTotalExpenses(userId: string): Promise<number> {
    const userExpenses = await this.getExpenses(userId);
    return userExpenses.reduce((total, expense) => total + parseFloat(expense.amount), 0);
  }

  async getCategoryTotals(userId: string): Promise<Record<string, number>> {
    const userExpenses = await this.getExpenses(userId);
    const totals: Record<string, number> = {};
    
    for (const expense of userExpenses) {
      totals[expense.category] = (totals[expense.category] || 0) + parseFloat(expense.amount);
    }
    
    return totals;
  }

  // Category operations
  async getCategories(userId: string): Promise<Category[]> {
    const userCategories = await db.select().from(categories).where(eq(categories.userId, userId));
    
    // If user has no categories, create default ones
    if (!userCategories || userCategories.length === 0) {
      await this.createDefaultCategories(userId);
      return await db.select().from(categories).where(eq(categories.userId, userId));
    }
    
    return userCategories;
  }

  async createDefaultCategories(userId: string): Promise<void> {
    const defaultCategories = [
      { name: "Food & Dining", icon: "UtensilsCrossed", color: "#FF6B6B", isDefault: true },
      { name: "Transportation", icon: "Car", color: "#4ECDC4", isDefault: true },
      { name: "Utilities", icon: "Zap", color: "#45B7D1", isDefault: true },
      { name: "Healthcare", icon: "Heart", color: "#96CEB4", isDefault: true },
      { name: "Entertainment", icon: "Music", color: "#FFEAA7", isDefault: true },
      { name: "Shopping", icon: "ShoppingBag", color: "#DDA0DD", isDefault: true },
      { name: "Education", icon: "GraduationCap", color: "#98D8C8", isDefault: true },
      { name: "Other", icon: "MoreHorizontal", color: "#A8E6CF", isDefault: true }
    ];

    await db.insert(categories).values(
      defaultCategories.map(cat => ({ ...cat, userId }))
    );
  }

  async getCategoryById(id: string, userId: string): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
    return category;
  }

  async createCategory(category: InsertCategory, userId: string): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values({ ...category, userId })
      .returning();
    return newCategory;
  }

  async updateCategory(id: string, updates: Partial<InsertCategory>, userId: string): Promise<Category | undefined> {
    const [category] = await db
      .update(categories)
      .set(updates)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();
    return category;
  }

  async deleteCategory(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Feedback operations
  async createFeedback(feedbackData: InsertFeedback, userId: string): Promise<Feedback> {
    const [newFeedback] = await db
      .insert(feedback)
      .values({ ...feedbackData, userId })
      .returning();
    return newFeedback;
  }

  async getFeedback(userId?: string): Promise<Feedback[]> {
    if (userId) {
      return await db.select().from(feedback).where(eq(feedback.userId, userId)).orderBy(feedback.createdAt);
    }
    return await db.select().from(feedback).orderBy(feedback.createdAt);
  }

  async updateFeedbackStatus(id: number, isResolved: boolean, adminResponse?: string): Promise<Feedback | undefined> {
    const [updatedFeedback] = await db
      .update(feedback)
      .set({ 
        isResolved, 
        adminResponse,
        updatedAt: new Date()
      })
      .where(eq(feedback.id, id))
      .returning();
    return updatedFeedback;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async getAllExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses).orderBy(expenses.createdAt);
  }

  async getAllIncome(): Promise<Income[]> {
    return await db.select().from(income).orderBy(income.createdAt);
  }

  async getAllInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).orderBy(invoices.createdAt);
  }

  // Receipt processing with OCR and storage
  async saveReceiptImage(file: Express.Multer.File, userId: string): Promise<Expense> {
    try {
      console.log(`📸 Processing receipt upload for user: ${userId}, file: ${file.originalname}`);
      
      // Validate file input
      if (!file || !file.buffer || !file.originalname) {
        throw new Error('Invalid file provided');
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        throw new Error(`File size too large. Maximum allowed size is 10MB`);
      }

      // Validate file type (only images)
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`);
      }

      // Validate filename
      if (file.originalname.length > 255) {
        throw new Error('Filename too long. Maximum allowed length is 255 characters');
      }

      // Upload image using the unified storage adapter
      const storageResult = await storageAdapter.upload(
        file.buffer,
        file.originalname,
        file.mimetype,
        userId
      );

      if (!storageResult || !storageResult.url) {
        throw new Error('Failed to upload image to storage');
      }

      console.log(`✅ Image uploaded successfully: ${storageResult.url}`);
      console.log(`🔍 Full file path: ${join(process.cwd(), 'uploads', 'dev', storageResult.key)}`);
      console.log(`🔍 Static route should serve: /uploads/dev/${storageResult.key}`);

      // Create basic expense record with image URL (will be updated by frontend with OCR data)
      const expenseData: InsertExpense = {
        merchant: "Receipt Upload",
        amount: "0",
        category: "Other",
        date: new Date(),
        notes: "Receipt uploaded. Please review and update.",
        items: [],
        imageUrl: storageResult.url,
      };

      const [expense] = await db
        .insert(expenses)
        .values({ ...expenseData, userId })
        .returning();

      console.log(`💾 Receipt processed and saved: ${expense.id}`);
      return expense;
      
    } catch (error) {
      console.error('❌ Error processing receipt:', error);
      
      // Fallback: save expense with minimal data if upload fails
      try {
        const fallbackExpense: InsertExpense = {
          merchant: "Receipt Upload",
          amount: "0",
          category: "Other",
          date: new Date(),
          notes: `Receipt upload failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please update manually.`,
          items: [],
          imageUrl: "",
        };

        const [expense] = await db
          .insert(expenses)
          .values({ ...fallbackExpense, userId })
          .returning();

        console.log(`⚠️ Fallback expense created: ${expense.id}`);
        return expense;
        
      } catch (fallbackError) {
        console.error('❌ Critical: Failed to create fallback expense:', fallbackError);
        throw new Error(`Receipt processing failed completely: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      }
    }
  }


  // Income operations
  async getIncome(userId: string): Promise<Income[]> {
    return await db
      .select()
      .from(income)
      .where(eq(income.userId, userId))
      .orderBy(income.createdAt);
  }

  async getIncomeById(id: string, userId: string): Promise<Income | undefined> {
    const [incomeRecord] = await db
      .select()
      .from(income)
      .where(and(eq(income.id, id), eq(income.userId, userId)));
    return incomeRecord;
  }

  async createIncome(insertIncome: InsertIncome, userId: string): Promise<Income> {
    const [incomeRecord] = await db
      .insert(income)
      .values({
        ...insertIncome,
        userId,
      })
      .returning();
    return incomeRecord;
  }

  async updateIncome(id: string, updates: Partial<InsertIncome>, userId: string): Promise<Income | undefined> {
    const [incomeRecord] = await db
      .update(income)
      .set(updates)
      .where(and(eq(income.id, id), eq(income.userId, userId)))
      .returning();
    return incomeRecord;
  }

  async deleteIncome(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(income)
      .where(and(eq(income.id, id), eq(income.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteAllIncomeRecords(userId: string): Promise<number> {
    console.log(`🗑️ Deleting all income records for user: ${userId}`);
    
    const result = await db
      .delete(income)
      .where(eq(income.userId, userId));
    
    const deletedCount = result.rowCount ?? 0;
    console.log(`📋 Deleted ${deletedCount} income records for user: ${userId}`);
    
    return deletedCount;
  }

  async getIncomeByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Income[]> {
    return await db
      .select()
      .from(income)
      .where(
        and(
          eq(income.userId, userId),
          gte(income.date, startDate),
          lte(income.date, endDate)
        )
      )
      .orderBy(income.date);
  }

  async getTotalIncome(userId: string): Promise<number> {
    const incomeRecords = await db
      .select()
      .from(income)
      .where(eq(income.userId, userId));
    
    return incomeRecords.reduce((sum, record) => sum + parseFloat(record.amount), 0);
  }

  // Invoice operations
  async getInvoices(userId: string): Promise<InvoiceWithWHT[]> {
    const invoiceTable = invoices;
    const whtTable = whtTransactions;
    
    const result = await db
      .select({
        // Invoice fields
        id: invoiceTable.id,
        userId: invoiceTable.userId,
        incomeId: invoiceTable.incomeId,
        invoiceNumber: invoiceTable.invoiceNumber,
        clientName: invoiceTable.clientName,
        clientEmail: invoiceTable.clientEmail,
        clientPhone: invoiceTable.clientPhone,
        clientAddress: invoiceTable.clientAddress,
        amount: invoiceTable.amount,
        description: invoiceTable.description,
        dueDate: invoiceTable.dueDate,
        issueDate: invoiceTable.issueDate,
        status: invoiceTable.status,
        amountPaid: invoiceTable.amountPaid,
        paymentTerms: invoiceTable.paymentTerms,
        createdAt: invoiceTable.createdAt,
        updatedAt: invoiceTable.updatedAt,
        // WHT transaction fields
        whtId: whtTable.id,
        whtUserId: whtTable.userId,
        whtInvoiceId: whtTable.invoiceId,
        whtInvoiceNumber: whtTable.invoiceNumber,
        whtClientName: whtTable.clientName,
        whtInvoiceAmount: whtTable.invoiceAmount,
        whtRate: whtTable.whtRate,
        whtAmount: whtTable.whtAmount,
        whtNetAmount: whtTable.netAmount,
        whtTransactionDate: whtTable.transactionDate,
        whtPaymentMethod: whtTable.paymentMethod,
        whtStatus: whtTable.status,
        whtCreatedAt: whtTable.createdAt,
        whtUpdatedAt: whtTable.updatedAt,
      })
      .from(invoiceTable)
      .leftJoin(whtTable, eq(whtTable.invoiceId, invoiceTable.id))
      .where(and(eq(invoiceTable.userId, userId), ne(invoiceTable.status, "deleted")))
      .orderBy(desc(invoiceTable.createdAt));
    
    // Group invoices and include their WHT transactions
    const invoicesMap = new Map<string, Invoice & { whtTransactions: any[] }>();
    
    result.forEach(row => {
      const invoiceId = row.id;
      
      if (!invoicesMap.has(invoiceId)) {
        // Create invoice object without WHT data
        const invoice = {
          id: row.id,
          userId: row.userId,
          incomeId: row.incomeId,
          invoiceNumber: row.invoiceNumber,
          clientName: row.clientName,
          clientEmail: row.clientEmail,
          clientPhone: row.clientPhone,
          clientAddress: row.clientAddress,
          amount: row.amount,
          description: row.description,
          dueDate: row.dueDate,
          issueDate: row.issueDate,
          status: row.status,
          amountPaid: row.amountPaid,
          paymentTerms: row.paymentTerms,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          whtTransactions: []
        };
        invoicesMap.set(invoiceId, invoice);
      }
      
      // Add WHT transaction if it exists
      if (row.whtId) {
        const invoice = invoicesMap.get(invoiceId)!;
        invoice.whtTransactions.push({
          id: row.whtId,
          userId: row.whtUserId,
          invoiceId: row.whtInvoiceId,
          invoiceNumber: row.whtInvoiceNumber,
          clientName: row.whtClientName,
          invoiceAmount: row.whtInvoiceAmount,
          whtRate: row.whtRate,
          whtAmount: row.whtAmount,
          netAmount: row.whtNetAmount,
          transactionDate: row.whtTransactionDate,
          paymentMethod: row.whtPaymentMethod,
          status: row.whtStatus,
          createdAt: row.whtCreatedAt,
          updatedAt: row.whtUpdatedAt,
        });
      }
    });
    
    const invoiceResults = Array.from(invoicesMap.values());
    
    // Debug: Log the sorting and filtering to verify
    console.log('Invoices filtered (excluding deleted):', invoiceResults.map(inv => ({ 
      id: inv.id, 
      number: inv.invoiceNumber, 
      date: inv.createdAt, 
      status: inv.status,
      whtCount: inv.whtTransactions.length 
    })));
    
    return invoiceResults;
  }

  async getInvoiceById(id: string, userId: string): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
    return invoice;
  }

  async createInvoice(insertInvoice: InsertInvoice, userId: string): Promise<Invoice> {
    const [invoice] = await db
      .insert(invoices)
      .values({
        ...insertInvoice,
        userId,
      })
      .returning();
    return invoice;
  }

  async updateInvoice(id: string, updates: Partial<InsertInvoice>, userId: string): Promise<Invoice | undefined> {
    const [invoice] = await db
      .update(invoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .returning();
    return invoice;
  }

  async deleteFullInvoiceAndRelated(id: string, userId: string): Promise<boolean> {
    console.log(`🔄 Starting cascade deletion of full payment invoice and related partial invoices:`, { invoiceId: id, userId });
    
    try {
      // First check if invoice exists and get related data
      const existingInvoice = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
        .limit(1);
      
      if (!existingInvoice || existingInvoice.length === 0) {
        console.log(`❌ Invoice not found:`, { invoiceId: id, userId });
        return false;
      }
      
      const invoice = existingInvoice[0];
      console.log(`📋 Found full payment invoice:`, { invoiceId: id, invoiceNumber: invoice.invoiceNumber, status: invoice.status });
      
      // Find all related partial invoices with same client and amount
      const relatedPartialInvoices = await db
        .select()
        .from(invoices)
        .where(and(
          eq(invoices.userId, userId),
          eq(invoices.clientName, invoice.clientName),
          eq(invoices.amount, invoice.amount),
          eq(invoices.status, 'partially_paid'),
          ne(invoices.id, id)
        ));
      
      console.log(`📊 Related partial invoices found:`, { invoiceId: id, count: relatedPartialInvoices.length });
      
      // Delete WHT transactions for all invoices (full + partial)
      const allInvoiceIds = [id, ...relatedPartialInvoices.map(inv => inv.id)];
      
      for (const invoiceId of allInvoiceIds) {
        const relatedWHT = await db
          .select()
          .from(whtTransactions)
          .where(eq(whtTransactions.invoiceId, invoiceId));
        
        if (relatedWHT && relatedWHT.length > 0) {
          console.log(`🔄 Deleting ${relatedWHT.length} WHT transactions for invoice:`, invoiceId);
          
          const whtDeleteResult = await db
            .delete(whtTransactions)
            .where(eq(whtTransactions.invoiceId, invoiceId));
          
          console.log(`📋 WHT transactions deleted for invoice ${invoiceId}:`, { 
            deletedCount: whtDeleteResult.rowCount,
            success: (whtDeleteResult.rowCount ?? 0) > 0
          });
        }
      }
      
      // Delete all partial invoices first
      for (const partialInvoice of relatedPartialInvoices) {
        console.log(`🔄 Deleting related partial invoice:`, partialInvoice.id);
        
        const partialDeleteResult = await db
          .delete(invoices)
          .where(and(eq(invoices.id, partialInvoice.id), eq(invoices.userId, userId)));
        
        console.log(`📋 Partial invoice deletion result:`, { 
          invoiceId: partialInvoice.id,
          deleted: (partialDeleteResult.rowCount ?? 0) > 0
        });
      }
      
      // Finally delete the full payment invoice
      console.log(`🔄 Now deleting the full payment invoice:`, { invoiceId: id });
      const result = await db
        .delete(invoices)
        .where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
      
      console.log(`📋 Full payment invoice deletion result:`, { 
        invoiceId: id, 
        deleted: (result.rowCount ?? 0) > 0,
        rowCount: result.rowCount
      });
      
      return (result.rowCount ?? 0) > 0;
      
    } catch (error) {
      console.error(`💥 Critical error in deleteFullInvoiceAndRelated:`, { 
        invoiceId: id, 
        userId: userId, 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async deleteInvoice(id: string, userId: string): Promise<boolean> {
    console.log(`🔄 Starting invoice deletion process:`, { invoiceId: id, userId });
    
    try {
      // First check if invoice exists and get related data
      const existingInvoice = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
        .limit(1);
      
      if (!existingInvoice || existingInvoice.length === 0) {
        console.log(`❌ Invoice not found:`, { invoiceId: id, userId });
        return false;
      }
      
      const invoice = existingInvoice[0];
      console.log(`📋 Found invoice:`, { invoiceId: id, invoiceNumber: invoice.invoiceNumber, status: invoice.status });
      
      // NEW: Check if this is a partial payment invoice and find related full payment invoice
      if (invoice.status === 'partially_paid') {
        console.log(`🔍 Checking for related full payment invoice for partial invoice...`);
        
        const relatedFullInvoice = await db
          .select()
          .from(invoices)
          .where(and(
            eq(invoices.userId, userId),
            eq(invoices.clientName, invoice.clientName),
            eq(invoices.amount, invoice.amount),
            eq(invoices.status, 'paid'),
            ne(invoices.id, id)
          ))
          .limit(1);
        
        if (relatedFullInvoice && relatedFullInvoice.length > 0) {
          console.log(`🚫 Partial invoice deletion blocked - found related full payment invoice:`, {
            partialInvoiceId: id,
            fullInvoiceId: relatedFullInvoice[0].id,
            fullInvoiceNumber: relatedFullInvoice[0].invoiceNumber
          });
          
          // Throw a specific error that the frontend can catch and handle
          const error = new Error('PARTIAL_INVOICE_DELETE_BLOCKED');
          (error as any).relatedInvoice = relatedFullInvoice[0];
          throw error;
        }
      }
      
      // Check for related WHT transactions
      const relatedWHT = await db
        .select()
        .from(whtTransactions)
        .where(eq(whtTransactions.invoiceId, id));
      
      console.log(`📊 Related WHT transactions found:`, { invoiceId: id, count: relatedWHT.length });
      
      if (relatedWHT && relatedWHT.length > 0) {
        console.log(`🔄 Deleting ${relatedWHT.length} related WHT transactions first...`);
        
        // Delete related WHT transactions to avoid foreign key constraint
        const whtDeleteResult = await db
          .delete(whtTransactions)
          .where(eq(whtTransactions.invoiceId, id));
        
        console.log(`📋 WHT transactions deleted:`, { 
          invoiceId: id, 
          deletedCount: whtDeleteResult.rowCount,
          success: (whtDeleteResult.rowCount ?? 0) > 0
        });
        
        // Wait a moment for the deletion to complete
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Check for related income records (if incomeId is set)
      if (existingInvoice[0].incomeId) {
        console.log(`🔄 Checking for related income record:`, { incomeId: existingInvoice[0].incomeId });
        
        const relatedIncome = await db
          .select()
          .from(income)
          .where(eq(income.id, existingInvoice[0].incomeId!));
        
        if (relatedIncome && relatedIncome.length > 0) {
          console.log(`🔄 Found related income record via incomeId, deleting it...`);
          
          // Delete the income record linked via incomeId
          const incomeDeleteResult = await db
            .delete(income)
            .where(and(eq(income.id, existingInvoice[0].incomeId!), eq(income.userId, userId)));
          
          console.log(`📋 Income record deleted via incomeId:`, { 
            incomeId: existingInvoice[0].incomeId,
            invoiceNumber: relatedIncome[0].invoiceNumber,
            deleted: (incomeDeleteResult.rowCount ?? 0) > 0,
            rowCount: incomeDeleteResult.rowCount
          });
          
          // Wait a moment for the deletion to complete
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // NEW: Check for ALL income records with matching invoiceNumber (comprehensive cascade deletion)
      console.log(`🔄 Checking for ALL income records with matching invoiceNumber:`, { invoiceNumber: existingInvoice[0].invoiceNumber });
      
      const allRelatedIncomeRecords = await db
        .select()
        .from(income)
        .where(and(
          eq(income.invoiceNumber, existingInvoice[0].invoiceNumber),
          eq(income.userId, userId)
        ));
      
      console.log(`📊 Found ${allRelatedIncomeRecords.length} income records with invoiceNumber "${existingInvoice[0].invoiceNumber}"`);
      
      if (allRelatedIncomeRecords && allRelatedIncomeRecords.length > 0) {
        console.log(`🔄 Deleting ALL related income records...`);
        
        // Delete ALL income records with matching invoiceNumber
        const cascadeIncomeDeleteResult = await db
          .delete(income)
          .where(and(
            eq(income.invoiceNumber, existingInvoice[0].invoiceNumber),
            eq(income.userId, userId)
          ));
        
        console.log(`📋 ALL related income records deleted:`, { 
          invoiceNumber: existingInvoice[0].invoiceNumber,
          deletedCount: cascadeIncomeDeleteResult.rowCount,
          success: (cascadeIncomeDeleteResult.rowCount ?? 0) > 0,
          deletedRecords: allRelatedIncomeRecords.map(record => ({
            id: record.id,
            description: record.description,
            amount: record.amount,
            invoiceNumber: record.invoiceNumber
          }))
        });
        
        // Wait a moment for the deletion to complete
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        console.log(`✅ No additional income records found with invoiceNumber "${existingInvoice[0].invoiceNumber}"`);
      }
      
      // Then delete the invoice
      console.log(`🔄 Now deleting invoice:`, { invoiceId: id });
      const result = await db
        .delete(invoices)
        .where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
      
      console.log(`📋 Invoice deletion result:`, { 
        invoiceId: id, 
        deleted: (result.rowCount ?? 0) > 0,
        rowCount: result.rowCount
      });
      
      return (result.rowCount ?? 0) > 0;
      
    } catch (error) {
      console.error(`💥 Critical error in deleteInvoice:`, { 
        invoiceId: id, 
        userId: userId, 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async getPendingInvoices(userId: string): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.userId, userId), eq(invoices.status, "pending")))
      .orderBy(invoices.dueDate);
  }

  // Income category operations
  async getIncomeCategories(userId: string): Promise<IncomeCategory[]> {
    return await db
      .select()
      .from(incomeCategories)
      .where(eq(incomeCategories.userId, userId))
      .orderBy(incomeCategories.createdAt);
  }

  async getIncomeCategoryById(id: string, userId: string): Promise<IncomeCategory | undefined> {
    const [category] = await db
      .select()
      .from(incomeCategories)
      .where(and(eq(incomeCategories.id, id), eq(incomeCategories.userId, userId)));
    return category;
  }

  async createIncomeCategory(insertCategory: InsertIncomeCategory, userId: string): Promise<IncomeCategory> {
    const [category] = await db
      .insert(incomeCategories)
      .values({
        ...insertCategory,
        userId,
      })
      .returning();
    return category;
  }

  async updateIncomeCategory(id: string, updates: Partial<InsertIncomeCategory>, userId: string): Promise<IncomeCategory | undefined> {
    const [category] = await db
      .update(incomeCategories)
      .set(updates)
      .where(and(eq(incomeCategories.id, id), eq(incomeCategories.userId, userId)))
      .returning();
    return category;
  }

  async deleteIncomeCategory(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(incomeCategories)
      .where(and(eq(incomeCategories.id, id), eq(incomeCategories.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // User settings operations
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    return settings;
  }

  async updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings> {
    const [existingSettings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));

    if (existingSettings) {
      const [updated] = await db
        .update(userSettings)
        .set({
          ...settings,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userSettings)
        .values({
          ...settings,
          userId,
        })
        .returning();
      return created;
    }
  }

  async saveNetWorthData(userId: string, netWorthData: any): Promise<any> {
    try {
      // Check if user settings already exist
      const [existingSettings] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId));

      if (existingSettings) {
        // Update existing settings
        const [updated] = await db
          .update(userSettings)
          .set({
            netWorthData,
            updatedAt: new Date(),
          })
          .where(eq(userSettings.userId, userId))
          .returning();
        return updated;
      } else {
        // Insert new settings
        const [created] = await db
          .insert(userSettings)
          .values({
            userId,
            netWorthData,
            updatedAt: new Date(),
          })
          .returning();
        return created;
      }
    } catch (error) {
      console.error("Error saving net worth data:", error);
      throw error;
    }
  }

  async getNetWorthHistory(userId: string): Promise<any[]> {
    try {
      const settings = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .orderBy(userSettings.createdAt);
      
      const netWorthRecords = settings
        .filter(setting => setting.netWorthData)
        .map(setting => {
          const netWorthData = typeof setting.netWorthData === 'string' 
            ? JSON.parse(setting.netWorthData) 
            : setting.netWorthData;
          return {
            ...netWorthData,
            createdAt: setting.createdAt,
            id: setting.id
          };
        });
      
      return netWorthRecords;
    } catch (error) {
      console.error("Error fetching net worth history:", error);
      throw error;
    }
  }

  // Savings goals operations
  async getSavingsGoals(userId: string): Promise<SavingsGoal[]> {
    return await db
      .select()
      .from(savingsGoals)
      .where(eq(savingsGoals.userId, userId))
      .orderBy(savingsGoals.createdAt);
  }

  async getSavingsGoalById(id: string, userId: string): Promise<SavingsGoal | undefined> {
    const [goal] = await db
      .select()
      .from(savingsGoals)
      .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)));
    return goal;
  }

  async createSavingsGoal(goal: InsertSavingsGoal, userId: string): Promise<SavingsGoal> {
    const [created] = await db
      .insert(savingsGoals)
      .values({
        ...goal,
        userId,
        currentAmount: "0", // Convert to string for decimal type
      })
      .returning();
    return created;
  }


  async updateSavingsGoal(id: string, updates: Partial<InsertSavingsGoal>, userId: string): Promise<SavingsGoal | undefined> {
    const [updated] = await db
      .update(savingsGoals)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)))
      .returning();
    return updated;
  }

  async deleteSavingsGoal(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(savingsGoals)
      .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Savings records operations
  async getSavingsRecords(userId: string): Promise<SavingsRecord[]> {
    return await db
      .select()
      .from(savingsRecords)
      .where(eq(savingsRecords.userId, userId))
      .orderBy(savingsRecords.createdAt);
  }

  async createSavingsRecord(record: InsertSavingsRecord, userId: string): Promise<SavingsRecord> {
    console.log("💾 Storage: Creating savings record");
    console.log("💾 Storage: Input record:", record);
    console.log("💾 Storage: User ID:", userId);
    
    try {
      const [created] = await db
        .insert(savingsRecords)
        .values({
          ...record,
          userId,
          date: record.date instanceof Date 
            ? record.date.toISOString().split('T')[0] 
            : record.date, // Handle both Date and string
          amount: record.amount.toString(), // Convert number to string for decimal type
        })
        .returning();
      
      console.log("💾 Storage: Successfully created record:", created);
      return created;
    } catch (error) {
      console.error("❌ Storage: Database error:", error);
      throw error;
    }
  }

  async deleteSavingsRecord(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(savingsRecords)
      .where(and(eq(savingsRecords.id, id), eq(savingsRecords.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async createWHTTransaction(data: {
    userId: string;
    invoiceId: string;
    invoiceNumber: string;
    clientName: string;
    invoiceAmount: number;
    whtRate: number;
    whtAmount: number;
    netAmount: number;
    paymentMethod: string;
    status: string;
  }) {
    const [whtTransaction] = await db
      .insert(whtTransactions)
      .values({
        userId: data.userId,
        invoiceId: data.invoiceId,
        invoiceNumber: data.invoiceNumber,
        clientName: data.clientName,
        invoiceAmount: data.invoiceAmount.toString(),
        whtRate: data.whtRate.toString(),
        whtAmount: data.whtAmount.toString(),
        netAmount: data.netAmount.toString(),
        paymentMethod: data.paymentMethod,
        status: data.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return whtTransaction;
  }

  async getWHTTransactions(userId: string) {
    return await db
      .select()
      .from(whtTransactions)
      .where(eq(whtTransactions.userId, userId))
      .orderBy(desc(whtTransactions.transactionDate));
  }
}

export const storage = new DatabaseStorage();
