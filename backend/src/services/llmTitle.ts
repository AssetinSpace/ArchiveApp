// LLM title extraction service — Sprint 5 (patched: Gemini 2.5 Flash).
//
// Google Gemini 2.5 Flash — 6–7× lacnejší ako Claude Haiku a pre extraction
// z OCR textu úplne postačuje (~$0.27 za celý archív batch).
//
// Princípy (Sprint 5 spec):
// - Sériové volania (nie parallel) + 500ms pauza medzi nimi — rate limit
//   poistka a deterministický cost control.
// - Per-call AbortController s 30s timeout.
// - OCR vstup orezaný na 2000 znakov (väčšina štítkov je kratšia, šetrí tokeny).
// - Výstup orezaný na 200 znakov.
// - Ak GEMINI_API_KEY nie je nastavený, extractTitleFromOcr hodí —
//   route handler to chytí a vráti 503 s jasnou hláškou.
// - processPendingTitles vráti pole výsledkov (úspechy + chyby) aby admin UI
//   mohlo zobraziť prehľad po batchi.

import type { PrismaClient } from "@prisma/client";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const LLM_TIMEOUT_MS = 30_000;
const LLM_DELAY_MS = 500;

export const LLM_BATCH_LIMIT_MAX = 50;

export interface LlmTitleResult {
  photoId: string;
  itemId: string;
  suggestedTitle: string | null;
  error: string | null;
}

export async function extractTitleFromOcr(ocrRawText: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Toto je OCR text zo štítku archívnej zložky s projektovou dokumentáciou (stavebníctvo, Slovensko). Vytiahni z neho najvýstižnejší názov dokumentu/projektu — max 120 znakov, slovenčina. Ak text je nezmyselný šum alebo prázdny, odpovedz prázdnym reťazcom.

Odpovedz LEN samotným názvom, nič iné — žiadne úvodzovky, žiadne vysvetlenie.

OCR text:
${ocrRawText.substring(0, 2000)}`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 150,
          temperature: 0.1,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API ${response.status}: ${await response.text()}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text && text.length > 0 ? text.substring(0, 200) : null;

  } finally {
    clearTimeout(timeout);
  }
}

// Nájde Items čo majú DONE OCR text + status NONE, sériovo cez Anthropic.
// Po každom volaní 500 ms pauza (rate limit poistka). Per-item try/catch
// — jedna chyba neukončí celý batch.
export async function processPendingTitles(
  prisma: PrismaClient,
  limit: number = LLM_BATCH_LIMIT_MAX,
): Promise<LlmTitleResult[]> {
  const safeLimit = Math.max(1, Math.min(limit, LLM_BATCH_LIMIT_MAX));

  // DISTINCT ON (i.id) zaručí jeden riadok per Item — najnovšiu DONE fotku
  // s neprázdnym OCR textom. Filter length(trim()) > 5 odfiltruje OCR šum.
  type Row = {
    item_id: string;
    photo_id: string;
    ocr_raw_text: string;
  };
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT DISTINCT ON (i.id) i.id AS item_id, p.id AS photo_id, p.ocr_raw_text
    FROM "Item" i
    JOIN "Photo" p ON p.item_id = i.id
    WHERE i.deleted_at IS NULL
      AND i.ocr_title_status = 'NONE'
      AND p.deleted_at IS NULL
      AND p.ocr_status = 'DONE'
      AND p.ocr_raw_text IS NOT NULL
      AND length(trim(p.ocr_raw_text)) > 5
    ORDER BY i.id, p.created_at DESC
    LIMIT ${safeLimit};
  `;

  const results: LlmTitleResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const suggestedTitle = await extractTitleFromOcr(row.ocr_raw_text);

      if (suggestedTitle) {
        await prisma.item.update({
          where: { id: row.item_id },
          data: {
            ocr_title: suggestedTitle,
            ocr_title_status: "SUGGESTED",
          },
        });
      }

      results.push({
        photoId: row.photo_id,
        itemId: row.item_id,
        suggestedTitle,
        error: null,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `[llmTitle] item ${row.item_id} failed:`,
        msg,
      );
      results.push({
        photoId: row.photo_id,
        itemId: row.item_id,
        suggestedTitle: null,
        error: msg,
      });
    }

    // Pauza medzi volaniami (okrem posledného).
    if (i < rows.length - 1) {
      await new Promise((r) => setTimeout(r, LLM_DELAY_MS));
    }
  }

  return results;
}
