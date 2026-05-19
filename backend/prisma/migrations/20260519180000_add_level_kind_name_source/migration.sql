-- Sprint 8: flexibilná hierarchia (level + kind + name_source)

ALTER TABLE "Item" ADD COLUMN "level" INTEGER;
ALTER TABLE "Item" ADD COLUMN "kind" TEXT;
ALTER TABLE "Item" ADD COLUMN "name_source" TEXT NOT NULL DEFAULT 'GENERATED';
ALTER TABLE "Item" ADD COLUMN "ocr_name_suggestion" TEXT;

UPDATE "Item" SET
  level = CASE "type_code"
    WHEN 'SKLAD'   THEN 1
    WHEN 'PALETA'  THEN 3
    WHEN 'KRABICA' THEN 4
    WHEN 'ZLOZKA'  THEN 5
    ELSE 5
  END,
  kind = "type_code"
WHERE "type_code" IS NOT NULL;

ALTER TABLE "Item" ALTER COLUMN "level" SET NOT NULL;
ALTER TABLE "Item" ALTER COLUMN "kind" SET NOT NULL;

UPDATE "Item" SET name = COALESCE(NULLIF(trim(name), ''), lower(kind) || '_1')
WHERE name IS NULL OR trim(name) = '';

ALTER TABLE "Item" ALTER COLUMN "name" SET NOT NULL;

ALTER TABLE "Item" ALTER COLUMN "type_code" DROP NOT NULL;
ALTER TABLE "Item" DROP CONSTRAINT IF EXISTS "Item_type_code_fkey";

CREATE INDEX "Item_level_idx" ON "Item"("level");
CREATE INDEX "Item_kind_idx" ON "Item"("kind");
