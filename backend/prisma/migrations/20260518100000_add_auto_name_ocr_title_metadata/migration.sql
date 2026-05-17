-- Sprint 5: auto_name + LLM OCR title extraction + metadata JSONB.
--
-- - auto_name: pozičný identifikátor (sklA_pal003_kra004_zlo015) generovaný
--   pri POST /items pre nové položky. Existujúce položky majú NULL — žiadny
--   backfill, autoName je informačný fallback.
-- - ocr_title + ocr_title_status: výsledok LLM extrakcie z OCR textu, prejde
--   stavmi NONE → SUGGESTED → CONFIRMED/REJECTED. Stav je TEXT (nie Postgres
--   ENUM) pre jednoduchšie pridávanie ďalších stavov bez migrácie.
-- - metadata + metadata_status: pripravené pre Sprint 6 (extraction projektant /
--   dátum / adresa / typ dokumentu...). V Sprint 5 sa nenaplňuje, len schéma
--   a export.

ALTER TABLE "Item" ADD COLUMN "auto_name" TEXT;
ALTER TABLE "Item" ADD COLUMN "ocr_title" TEXT;
ALTER TABLE "Item" ADD COLUMN "ocr_title_status" TEXT NOT NULL DEFAULT 'NONE';
ALTER TABLE "Item" ADD COLUMN "metadata" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "Item" ADD COLUMN "metadata_status" TEXT NOT NULL DEFAULT 'NONE';

-- Index na ocr_title_status zrýchli GET /api/llm-title/pending-review
-- (filter ocr_title_status='SUGGESTED') aj /status agregát.
CREATE INDEX "Item_ocr_title_status_idx" ON "Item"("ocr_title_status");
