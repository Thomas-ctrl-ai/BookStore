ALTER TABLE "Product" ADD COLUMN "levels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
UPDATE "Product" SET "levels" = ARRAY["level"] WHERE "level" IS NOT NULL AND "level" <> '';
ALTER TABLE "BookOrderItem" ADD COLUMN "levelSnapshot" TEXT;
