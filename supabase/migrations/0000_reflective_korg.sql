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
	"sender" varchar(255),
	"receiver" varchar(255),
	"receiver_answer" text,
	"photo_urls" text[],
	"video_url" varchar(255),
	"date_report" date,
	"date_response" date,
	"status" varchar(255)
);
