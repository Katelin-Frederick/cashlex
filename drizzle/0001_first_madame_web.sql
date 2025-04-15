CREATE TABLE "cashlex_account" (
	"userId" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" timestamp with time zone,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "cashlex_account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
ALTER TABLE "cashlex_session" ALTER COLUMN "userId" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "cashlex_user" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "cashlex_user" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "cashlex_account" ADD CONSTRAINT "cashlex_account_userId_cashlex_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."cashlex_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashlex_user" ADD CONSTRAINT "cashlex_user_email_unique" UNIQUE("email");