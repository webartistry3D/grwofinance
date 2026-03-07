CREATE TABLE "firs_compliance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tax_id" text NOT NULL,
	"business_name" text NOT NULL,
	"registration_number" text,
	"tax_office" text NOT NULL,
	"tax_category" text NOT NULL,
	"filing_frequency" text NOT NULL,
	"last_filing_date" date,
	"next_filing_date" date,
	"compliance_status" text DEFAULT 'compliant' NOT NULL,
	"outstanding_returns" integer DEFAULT 0 NOT NULL,
	"total_tax_liability" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_calendar" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tax_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" date NOT NULL,
	"reminder_date" date,
	"status" text DEFAULT 'pending' NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurring_frequency" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"expense_id" uuid,
	"invoice_id" uuid,
	"receipt_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"amount" numeric(12, 2) NOT NULL,
	"tax_amount" numeric(12, 2),
	"date" date NOT NULL,
	"category" text NOT NULL,
	"image_url" text,
	"file_url" text,
	"tags" text[],
	"is_deductible" boolean DEFAULT true NOT NULL,
	"tax_year" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"report_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"report_period" text NOT NULL,
	"generated_date" timestamp DEFAULT now() NOT NULL,
	"file_url" text,
	"data" jsonb,
	"status" text DEFAULT 'generated' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "withholding_tax" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"invoice_id" uuid,
	"income_id" uuid,
	"amount" numeric(12, 2) NOT NULL,
	"wht_rate" text NOT NULL,
	"wht_amount" numeric(12, 2) NOT NULL,
	"deductee_name" text NOT NULL,
	"deductee_tax_id" text,
	"transaction_date" date NOT NULL,
	"payment_date" date,
	"certificate_number" text,
	"status" text DEFAULT 'deducted' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "firs_compliance" ADD CONSTRAINT "firs_compliance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_calendar" ADD CONSTRAINT "tax_calendar_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_receipts" ADD CONSTRAINT "tax_receipts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_receipts" ADD CONSTRAINT "tax_receipts_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_receipts" ADD CONSTRAINT "tax_receipts_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_reports" ADD CONSTRAINT "tax_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withholding_tax" ADD CONSTRAINT "withholding_tax_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withholding_tax" ADD CONSTRAINT "withholding_tax_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withholding_tax" ADD CONSTRAINT "withholding_tax_income_id_income_id_fk" FOREIGN KEY ("income_id") REFERENCES "public"."income"("id") ON DELETE no action ON UPDATE no action;