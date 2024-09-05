CREATE TABLE IF NOT EXISTS "executors" (
	"id" serial PRIMARY KEY NOT NULL,
	"surname_name" varchar(255),
	"telegram_acc" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_text" text,
	"department" varchar(255),
	"user_id" integer,
	"receiver" varchar(255),
	"receiver_answer" text,
	"photo_urls" text[],
	"video_url" varchar(255),
	"date_report" date,
	"date_response" date,
	"status" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"telegram_id" text,
	"language" varchar(255),
	"phone_number" varchar(255),
	"email" varchar(255),
	CONSTRAINT "users_id_unique" UNIQUE("id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
