CREATE TABLE "cashlex_session" (
	"sessionToken" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cashlex_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password_hash" text,
	CONSTRAINT "cashlex_user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "cashlex_verification_token" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "cashlex_verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "cashlex_session" ADD CONSTRAINT "cashlex_session_userId_cashlex_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."cashlex_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "t_user_id_idx" ON "cashlex_session" USING btree ("userId");