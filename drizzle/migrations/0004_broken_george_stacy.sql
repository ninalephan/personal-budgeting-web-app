-- Dropping the shared/global default categories (household_id IS NULL)
-- seeded in 0003 — every category is now household-owned, so households
-- build their own list from scratch instead of starting from defaults
-- that would otherwise block the NOT NULL constraint below.
DELETE FROM "categories" WHERE "household_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "household_id" SET NOT NULL;
