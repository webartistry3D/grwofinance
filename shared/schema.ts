import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, uuid, boolean, index, jsonb, serial, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: text("password").notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  subscriptionPlan: text("subscription_plan").default("freemium").notNull(), // 'freemium' or 'premium'
  subscriptionStatus: text("subscription_status").default("active").notNull(), // 'active', 'canceled', 'past_due'
  subscriptionEndDate: timestamp("subscription_end_date"),
  monthlyScansUsed: text("monthly_scans_used").default("0").notNull(), // Reset monthly
  lastScanResetDate: timestamp("last_scan_reset_date").defaultNow().notNull(),
  paystackCustomerCode: text("paystack_customer_code"),
  paystackSubscriptionCode: text("paystack_subscription_code"),
  paystackSubscriptionToken: text("paystack_subscription_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User settings table for business information and invoice settings
export const userSettings = pgTable("user_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),
  businessName: text("business_name"),
  businessAddress: text("business_address"),
  businessEmail: text("business_email"),
  businessPhone: text("business_phone"),
  defaultPaymentTerms: text("default_payment_terms").default("Net 30"),
  invoiceNotes: text("invoice_notes"),
  taxRate: text("tax_rate").default("7.5"),
  nextInvoiceNumber: text("next_invoice_number").default("INV-001"),
  totalAssetValue: decimal("total_asset_value", { precision: 12, scale: 2 }),
  netWorthData: jsonb("net_worth_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Expenses table with user relationship
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  merchant: text("merchant").notNull(),
  category: text("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).default("0").notNull(), // VAT paid on purchases (input VAT)
  vatRate: decimal("vat_rate", { precision: 5, scale: 4 }).default("0.0000").notNull(), // VAT rate on expense
  whtAmount: decimal("wht_amount", { precision: 10, scale: 2 }).default("0").notNull(), // WHT deducted from expense
  whtRate: decimal("wht_rate", { precision: 5, scale: 4 }).default("0.0000").notNull(), // WHT rate on expense
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(), // Amount after WHT deduction
  date: timestamp("date").notNull(),
  notes: text("notes"),
  items: text("items").array(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Income tracking tables
export const incomeCategories = pgTable("income_categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const income = pgTable("income", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  source: text("source").notNull(), // Client name, company, etc.
  category: text("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  grossAmount: decimal("gross_amount", { precision: 10, scale: 2 }).notNull(), // Amount before WHT
  whtAmount: decimal("wht_amount", { precision: 10, scale: 2 }).default("0").notNull(), // WHT deducted
  whtRate: decimal("wht_rate", { precision: 5, scale: 4 }).default("0.0000").notNull(), // WHT rate (5%, 10%, etc.)
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(), // Amount after WHT
  frequency: text("frequency").default("monthly").notNull(), // monthly, weekly, biweekly, quarterly, yearly, one-time
  date: timestamp("date").notNull(),
  description: text("description"),
  invoiceNumber: text("invoice_number"),
  paymentMethod: text("payment_method"), // cash, bank_transfer, paystack, etc.
  status: text("status").default("received").notNull(), // received, pending, overdue
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  incomeId: uuid("income_id").references(() => income.id),
  invoiceNumber: text("invoice_number").notNull(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  clientAddress: text("client_address"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).default("0").notNull(), // VAT collected on this invoice
  vatRate: decimal("vat_rate", { precision: 5, scale: 4 }).default("0.075").notNull(), // VAT rate (7.5%)
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(), // Amount before VAT
  description: text("description"),
  dueDate: timestamp("due_date"),
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  status: text("status").default("draft").notNull(), // draft, sent, paid, partially_paid, overdue, cancelled
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0").notNull(), // Track partial payments
  vatPaid: decimal("vat_paid", { precision: 10, scale: 2 }).default("0").notNull(), // VAT amount paid to tax authority
  paymentTerms: text("payment_terms"), // Net 30, Due on receipt, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Feedback table for in-app feedback collection
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(), // "feature", "bug", "support", "general"
  rating: integer("rating"), // 1-5 star rating
  subject: varchar("subject", { length: 200 }),
  message: text("message").notNull(),
  page: varchar("page", { length: 100 }), // which page feedback was submitted from
  isResolved: boolean("is_resolved").default(false),
  adminResponse: text("admin_response"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WHT (Withholding Tax) Transactions table
export const whtTransactions = pgTable("wht_transactions", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  invoiceId: uuid("invoice_id").references(() => invoices.id),
  invoiceNumber: text("invoice_number").notNull(),
  clientName: text("client_name").notNull(),
  invoiceAmount: decimal("invoice_amount", { precision: 10, scale: 2 }).notNull(),
  whtRate: decimal("wht_rate", { precision: 5, scale: 4 }).default("0.1").notNull(),
  whtAmount: decimal("wht_amount", { precision: 10, scale: 2 }).notNull(),
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(),
  transactionDate: timestamp("transaction_date").defaultNow().notNull(),
  paymentMethod: text("payment_method").default("Bank Transfer"),
  status: text("status").default("deducted"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  expenses: many(expenses),
  categories: many(categories),
  incomeCategories: many(incomeCategories),
  income: many(income),
  invoices: many(invoices),
  whtTransactions: many(whtTransactions),
  feedback: many(feedback),
}));


export const whtTransactionsRelations = relations(whtTransactions, ({ one }) => ({
  user: one(users, {
    fields: [whtTransactions.userId],
    references: [users.id],
  }),
  invoice: one(invoices, {
    fields: [whtTransactions.invoiceId],
    references: [invoices.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
}));

export const incomeCategoriesRelations = relations(incomeCategories, ({ one }) => ({
  user: one(users, {
    fields: [incomeCategories.userId],
    references: [users.id],
  }),
}));

export const incomeRelations = relations(income, ({ one }) => ({
  user: one(users, {
    fields: [income.userId],
    references: [users.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  income: one(income, {
    fields: [invoices.incomeId],
    references: [income.id],
  }),
  whtTransactions: many(whtTransactions),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses)
  .omit({
    id: true,
    userId: true,
    createdAt: true,
  })
  .extend({
    date: z.string().or(z.date())
      .transform(val => typeof val === 'string' ? new Date(val) : val)
      .refine(val => val instanceof Date && !isNaN(val.getTime()), "Invalid date"),
  });


export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIncomeCategorySchema = createInsertSchema(incomeCategories).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertIncomeSchema = createInsertSchema(income).omit({
  id: true,
  userId: true,
  createdAt: true,
}).extend({
  date: z.string().or(z.date()).transform((val) => typeof val === 'string' ? new Date(val) : val),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dueDate: z.string().or(z.date()).transform((val) => typeof val === 'string' ? new Date(val) : val),
  issueDate: z.string().or(z.date()).transform((val) => typeof val === 'string' ? new Date(val) : val).optional(),
});

// Savings Goals table
export const savingsGoals = pgTable("savings_goals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  targetAmount: decimal("target_amount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  deadline: timestamp("deadline").notNull(),
  category: text("category").default("general").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Savings Records table
export const savingsRecords = pgTable("savings_records", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date").notNull(),
  time: text("time").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSavingsGoalSchema = createInsertSchema(savingsGoals)
  .pick({
    name: true,
    targetAmount: true,
    deadline: true,
    category: true,
  })
  .extend({
    deadline: z.coerce.date(),
  });

export const insertSavingsRecordSchema = createInsertSchema(savingsRecords)
  .pick({
    amount: true,
    date: true,
    time: true,
  })
  .extend({
    amount: z.coerce.number(),
    date: z.string().transform((str) => new Date(str)), // Accept string and convert to Date
  });
  

// Tax Compliance Tables

// Tax Calendar for filing deadlines and reminders
export const taxCalendar = pgTable("tax_calendar", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  taxType: text("tax_type").notNull(), // 'VAT', 'WHT', 'CIT', 'PAYE'
  title: text("title").notNull(),
  description: text("description"),
  dueDate: date("due_date").notNull(),
  reminderDate: date("reminder_date"),
  status: text("status").default("pending").notNull(), // 'pending', 'completed', 'overdue'
  isRecurring: boolean("is_recurring").default(false).notNull(),
  recurringFrequency: text("recurring_frequency"), // 'monthly', 'quarterly', 'yearly'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Withholding Tax (WHT) tracking
export const withholdingTax = pgTable("withholding_tax", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  invoiceId: uuid("invoice_id").references(() => invoices.id),
  incomeId: uuid("income_id").references(() => income.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  whtRate: text("wht_rate").notNull(), // '5%', '10%', etc.
  whtAmount: decimal("wht_amount", { precision: 12, scale: 2 }).notNull(),
  deducteeName: text("deductee_name").notNull(),
  deducteeTaxId: text("deductee_tax_id"),
  transactionDate: date("transaction_date").notNull(),
  paymentDate: date("payment_date"),
  certificateNumber: text("certificate_number"),
  status: text("status").default("deducted").notNull(), // 'deducted', 'remitted', 'certified'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tax Reports generation tracking
export const taxReports = pgTable("tax_reports", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  reportType: text("report_type").notNull(), // 'VAT_monthly', 'WHT_monthly', 'CIT_annual', 'tax_summary'
  title: text("title").notNull(),
  description: text("description"),
  reportPeriod: text("report_period").notNull(), // '2024-01', 'Q1-2024', '2024'
  generatedDate: timestamp("generated_date").defaultNow().notNull(),
  fileUrl: text("file_url"), // Path to generated PDF/Excel file
  data: jsonb("data"), // Report data in JSON format
  status: text("status").default("generated").notNull(), // 'generated', 'downloaded', 'archived'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tax Receipts organization
export const taxReceipts = pgTable("tax_receipts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  expenseId: uuid("expense_id").references(() => expenses.id),
  invoiceId: uuid("invoice_id").references(() => invoices.id),
  receiptType: text("receipt_type").notNull(), // 'vat_invoice', 'wht_certificate', 'tax_payment', 'deductible_expense'
  title: text("title").notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }),
  date: date("date").notNull(),
  category: text("category").notNull(), // 'input_vat', 'output_vat', 'wht_deducted', 'wht_paid', 'deductible'
  imageUrl: text("image_url"),
  fileUrl: text("file_url"),
  tags: text("tags").array(),
  isDeductible: boolean("is_deductible").default(true).notNull(),
  taxYear: text("tax_year").notNull(), // '2024'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// FIRS Compliance tracking
export const firsCompliance = pgTable("firs_compliance", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  taxId: text("tax_id").notNull(), // Tax Identification Number
  businessName: text("business_name").notNull(),
  registrationNumber: text("registration_number"), // CAC/BN number
  taxOffice: text("tax_office").notNull(), // FIRS tax office
  taxCategory: text("tax_category").notNull(), // 'individual', 'company', 'partnership'
  filingFrequency: text("filing_frequency").notNull(), // 'monthly', 'quarterly', 'annually'
  lastFilingDate: date("last_filing_date"),
  nextFilingDate: date("next_filing_date"),
  complianceStatus: text("compliance_status").default("compliant").notNull(), // 'compliant', 'non_compliant', 'pending'
  outstandingReturns: integer("outstanding_returns").default(0).notNull(),
  totalTaxLiability: decimal("total_tax_liability", { precision: 12, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type IncomeCategory = typeof incomeCategories.$inferSelect;
export type InsertIncomeCategory = z.infer<typeof insertIncomeCategorySchema>;
export type Income = typeof income.$inferSelect;
export type InsertIncome = z.infer<typeof insertIncomeSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceWithWHT = Invoice & {
  whtTransactions: Array<{
    id: number;
    userId: string | null;
    invoiceId: string | null;
    invoiceNumber: string;
    clientName: string;
    invoiceAmount: string;
    whtRate: string;
    whtAmount: string;
    netAmount: string;
    transactionDate: Date;
    paymentMethod: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
};
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type InsertSavingsGoal = z.infer<typeof insertSavingsGoalSchema>;
export type SavingsRecord = typeof savingsRecords.$inferSelect;
export type InsertSavingsRecord = z.infer<typeof insertSavingsRecordSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

// Tax Compliance Types
export type TaxCalendar = typeof taxCalendar.$inferSelect;
export type WithholdingTax = typeof withholdingTax.$inferSelect;
export type TaxReport = typeof taxReports.$inferSelect;
export type TaxReceipt = typeof taxReceipts.$inferSelect;
export type FirsCompliance = typeof firsCompliance.$inferSelect;

// OCR Result type for receipt scanning
export interface OCRResult {
  merchant?: string;
  amount?: number;
  items?: OCRItem[];
}

export interface OCRItem {
  name?: string;
  price?: number;
  quantity?: number;
}

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

// Tax Compliance Schemas
export const insertTaxCalendarSchema = createInsertSchema(taxCalendar).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWithholdingTaxSchema = createInsertSchema(withholdingTax).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaxReportSchema = createInsertSchema(taxReports).omit({
  id: true,
  userId: true,
  createdAt: true,
});

// Bank accounts table
export const bankAccounts = pgTable("bank_accounts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bankName: varchar("bank_name", { length: 255 }).notNull(),
  accountName: varchar("account_name", { length: 255 }).notNull(),
  accountNumber: varchar("account_number", { length: 50 }).notNull(),
  accountType: varchar("account_type", { length: 20 }).notNull().default("savings"),
  currency: varchar("currency", { length: 3 }).notNull().default("NGN"),
  isDefault: boolean("is_default").notNull().default(false),
  includeInInvoice: boolean("include_in_invoice").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`NOW()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`NOW()`),
}, (table) => [index("IDX_bank_accounts_user_id").on(table.userId)]);

// Bank accounts relations
export const bankAccountsRelations = relations(bankAccounts, ({ one }) => ({
  user: one(users, {
    fields: [bankAccounts.userId],
    references: [users.id],
  }),
}));

export const insertTaxReceiptSchema = createInsertSchema(taxReceipts).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFirsComplianceSchema = createInsertSchema(firsCompliance).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

// Tax Compliance Insert Types
export type InsertTaxCalendar = z.infer<typeof insertTaxCalendarSchema>;
export type InsertWithholdingTax = z.infer<typeof insertWithholdingTaxSchema>;
export type InsertTaxReport = z.infer<typeof insertTaxReportSchema>;
export type InsertTaxReceipt = z.infer<typeof insertTaxReceiptSchema>;
export type InsertFirsCompliance = z.infer<typeof insertFirsComplianceSchema>;
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
