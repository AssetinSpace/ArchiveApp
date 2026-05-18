-- Metadata-only: odstránenie LLM title workflow (ocr_title / ocr_title_status).
DROP INDEX IF EXISTS "Item_ocr_title_status_idx";
ALTER TABLE "Item" DROP COLUMN IF EXISTS "ocr_title";
ALTER TABLE "Item" DROP COLUMN IF EXISTS "ocr_title_status";
