-- Posledná chyba OCR (Gemini HTTP text, R2, parse…) — zobrazí sa pri FAILED fotkách.
ALTER TABLE "Photo" ADD COLUMN "ocr_last_error" TEXT;
