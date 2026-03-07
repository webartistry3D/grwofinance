ALTER TABLE "income" ADD COLUMN "frequency" text DEFAULT 'monthly' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "total_asset_value" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "net_worth_data" jsonb;