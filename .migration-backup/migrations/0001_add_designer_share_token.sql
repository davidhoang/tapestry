ALTER TABLE "designers" ADD COLUMN IF NOT EXISTS "share_token" text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "designers_share_token_unique" ON "designers" ("share_token");
