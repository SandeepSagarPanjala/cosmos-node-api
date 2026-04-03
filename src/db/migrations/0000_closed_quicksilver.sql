CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--> statement-breakpoint
CREATE TABLE "exoplanets" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" varchar(100) NOT NULL,
	"scientific_name" varchar(100),
	"image_url" text,
	"discovered_on" date,
	"discovered_by" varchar(255),
	"distance_from_earth_ly" numeric(15, 2),
	"solar_system_name" varchar(100) DEFAULT 'Unknown',
	"lead_researcher_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "exoplanets_scientific_name_key" UNIQUE("scientific_name")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"used" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"email" varchar(255),
	"password_hash" text NOT NULL,
	"username" varchar(50) NOT NULL,
	"display_name" varchar(100),
	"is_active" boolean DEFAULT true,
	"role" varchar(20) DEFAULT 'user',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "users_email_key" UNIQUE("email"),
	CONSTRAINT "users_username_key" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "exoplanets" ADD CONSTRAINT "exoplanets_lead_researcher_id_fkey" FOREIGN KEY ("lead_researcher_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;