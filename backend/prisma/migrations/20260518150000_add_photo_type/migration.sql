-- Sprint 6: rozlíšenie LABEL vs OVERVIEW fotky.
--
-- LABEL = fotka štítku, vstupuje do OCR pipeline (default — všetky existujúce
--   riadky dostanú LABEL, čo zachová terajšie OCR správanie).
-- OVERVIEW = vizuálna referencia ako vyzerá krabica/paleta. OCR sa nikdy
--   nespúšťa; pri uploade route nastaví ocr_status = DONE aby neostala visieť
--   v PENDING štatistikách (viď backend/src/routes/photos.ts).
--
-- Filtre OCR endpointov (status / process-pending / failed / recent) sú
-- zúžené na photo_type = 'LABEL' v backend/src/routes/ocr.ts +
-- backend/src/services/ocr.ts, takže OVERVIEW nikdy do batchu nezasiahne.

-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('LABEL', 'OVERVIEW');

-- AlterTable
ALTER TABLE "Photo" ADD COLUMN "photo_type" "PhotoType" NOT NULL DEFAULT 'LABEL';

-- CreateIndex
CREATE INDEX "Photo_photo_type_idx" ON "Photo"("photo_type");
