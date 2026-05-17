// LLM title extraction service — Sprint 5.
//
// Anthropic Claude Haiku API (claude-haiku-4-5-20251001) — 12× lacnejší ako
// Sonnet a pre extraction z OCR textu úplne postačuje (~$0.40 / 1000 štítkov).
//
// Princípy (Sprint 5 spec):
// - Sériové volania (nie parallel) + 500ms pauza medzi nimi — rate limit
//   poistka a deterministický cost control.
// - Per-call AbortController s 30s timeout.
// - OCR vstup orezaný na 2000 znakov (väčšina štítkov je kratšia, šetrí tokeny).
// - Výstup orezaný na 200 znakov.
// - Ak ANTHROPIC_API_KEY nie je nastavený, extractTitleFromOcr hodí —
//   route handler to chytí a vráti 503 s jasnou hláškou.
// - processPendingTitles vráti pole výsledkov (úspechy + chyby) aby admin UI
//   mohlo zobraziť prehľad po batchi.

import type { PrismaClient } from "@prisma/client";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const LLM_MODEL = "claude-haiku-4-5-20251001";
const LLM_TIMEOUT_MS = 30_000;
const LLM_DELAY_MS = 500;
const OCR_INPUT_MAX_CHARS = 2000;
const TITLE_OUTPUT_MAX_CHARS = 200;

export const LLM_BATCH_LIMIT_MAX = 50;

export interface LlmTitleResult {
  photoId: string;
  itemId: string;
  suggestedTitle: string | null;
  error: string | null;
}

// Volá Anthropic API a vráti extrahovaný titulok alebo null pre prázdny/šum
// vstup. Hodí ak chýba API key alebo HTTP zlyhá / timeout-uje.
export async function extractTitleFromOcr(
  ocrRawText: string,
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: LLM_MODEL,
        max_tokens: 150,
        messages: [
          {
            role: "user",
            content: `Toto je OCR text zo štítku archívnej zložky s projektovou dokumentáciou (stavebníctvo, Slovensko). Vytiahni z neho najvýstižnejší názov dokumentu/projektu — max 120 znakov, slovenčina. Ak text je nezmyselný šum alebo prázdny, odpovedz prázdnym reťazcom.

Odpovedz LEN samotným názvom, nič iné — žiadne úvodzovky, žiadne vysvetlenie.

OCR text:
${ocrRawText.substring(0, OCR_INPUT_MAX_CHARS)}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Anthropic API ${response.status}: ${body}`);
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text =
      data.content
        ?.filter((b) => b.type === "text" && typeof b.text === "string")
        .map((b) => b.text as string)
        .join("")
        .trim() ?? "";

    if (text.length === 0) return null;
    return text.substring(0, TITLE_OUTPUT_MAX_CHARS);
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
