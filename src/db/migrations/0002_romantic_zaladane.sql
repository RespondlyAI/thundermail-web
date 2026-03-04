CREATE TABLE IF NOT EXISTS "email_events" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email_id" varchar NOT NULL,
	"event_type" varchar NOT NULL,
	"event_source" varchar NOT NULL,
	"organization_id" varchar,
	"business_user_id" varchar,
	"correlation_id" varchar,
	"metadata" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_events" ADD CONSTRAINT "email_events_email_id_emails_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_event_email_idx" ON "email_events" ("email_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_event_type_idx" ON "email_events" ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_event_source_idx" ON "email_events" ("event_source");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_event_org_idx" ON "email_events" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_event_business_user_idx" ON "email_events" ("business_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_event_correlation_idx" ON "email_events" ("correlation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_event_created_at_idx" ON "email_events" ("created_at");