CREATE TYPE "public"."user_role" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TABLE "blog" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "blog_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"userId" integer NOT NULL,
	"content_payload" jsonb NOT NULL,
	"cover_image" varchar NOT NULL,
	"slug" varchar(255) NOT NULL,
	"status" varchar(16) NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "blog_slug_unique" UNIQUE("slug"),
	CONSTRAINT "blog_status_check" CHECK ("blog"."status" in ('pending', 'active', 'inactive'))
);
--> statement-breakpoint
CREATE TABLE "content" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "content_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"section" varchar(32) NOT NULL,
	"order" integer NOT NULL,
	"contentChangesLogId" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "content_changes_log" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "content_changes_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"status" varchar(16) NOT NULL,
	"userId" integer NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_changes_log_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "lead_capture" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lead_capture_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"attribution" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"nama" text NOT NULL,
	"email" text NOT NULL,
	"nomor_wa" text NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lead_capture_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"refresh_expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"attribution" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"token_hash" text NOT NULL,
	"request_hash" text NOT NULL,
	"buyer" jsonb NOT NULL,
	"items" jsonb NOT NULL,
	"total" integer NOT NULL,
	"bank" jsonb NOT NULL,
	"status" text DEFAULT 'awaiting_payment' NOT NULL,
	"expires_at" timestamp (3) with time zone NOT NULL,
	"proof_key" text,
	"proof_bucket" text,
	"rejection_reason" text,
	"reviewed_by" integer,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "orders_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "orders_status_check" CHECK ("orders"."status" in ('awaiting_payment','review','paid','rejected','expired','cancelled')),
	CONSTRAINT "orders_total_positive" CHECK ("orders"."total">0)
);
--> statement-breakpoint
ALTER TABLE "blog" ADD CONSTRAINT "blog_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_contentChangesLogId_content_changes_log_id_fk" FOREIGN KEY ("contentChangesLogId") REFERENCES "public"."content_changes_log"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_changes_log" ADD CONSTRAINT "content_changes_log_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_public_list_idx" ON "blog" USING btree ("status","created_at","id") WHERE "blog"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "content_log_section_unique" ON "content" USING btree ("contentChangesLogId","section");--> statement-breakpoint
CREATE UNIQUE INDEX "content_log_single_pending" ON "content_changes_log" USING btree ("status") WHERE "content_changes_log"."status" = 'pending' AND "content_changes_log"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "content_log_single_active" ON "content_changes_log" USING btree ("status") WHERE "content_changes_log"."status" = 'active' AND "content_changes_log"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_access_token_unique" ON "sessions" USING btree ("access_token");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_refresh_token_unique" ON "sessions" USING btree ("refresh_token");--> statement-breakpoint
CREATE UNIQUE INDEX "user_username_unique" ON "user" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_unique" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "orders_status_created_idx" ON "orders" USING btree ("status","created_at");