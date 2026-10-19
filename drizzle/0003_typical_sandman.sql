ALTER TABLE "tickets" ADD COLUMN "due_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "resolved_at" timestamp with time zone;