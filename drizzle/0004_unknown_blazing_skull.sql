CREATE TABLE "cashlex_budget" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"amount" numeric(10, 2) NOT NULL,
	"spent" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "cashlex_budget" ADD CONSTRAINT "cashlex_budget_userId_cashlex_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."cashlex_user"("id") ON DELETE no action ON UPDATE no action;