// LLM metadata extraction service — Sprint 7.
//
// Metadata-only LLM workflow. Z OCR textu (Photo.ocr_raw_text, LABEL fotky)
// navrhne 3–10 relevantných polí ako JSONB. Nepoužíva obrázok z R2.
//
// Princípy:
// - Sériové volania, 500 ms pauza — cost control + rate limit poistka.
// - Per-call AbortController s 30 s timeoutom.
// - OCR vstup = zreťazený text z max 3 najnovších LABEL fotiek (ako /inventory).
// - Gemini 2.5 Flash: thinkingBudget 0 (inak môže vrátiť prázdny text).
// - Bez GEMINI_API_KEY → throw, route handler vráti 503.

import type { PrismaClient } from "@prisma/client";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const LLM_TIMEOUT_MS = 30_000;
const LLM_DELAY_MS = 500;
const OCR_INPUT_MAX_CHARS = 2000;
const LABEL_OCR_PHOTO_TAKE = 3;

export const LLM_METADATA_BATCH_LIMIT_MAX = 50;

export const KNOWN_METADATA_KEYS = [
  "stavba",
  "cast",
  "projektant",
  "adresa",
  "cislo",
  "datum",
  "stupen",
] as const;

export type MetadataPayload = Record<string, string | null>;

export interface LlmMetadataResult {
  photoId: string | null;
  itemId: string;
  metadata: MetadataPayload | null;
  error: string | null;
  ocrTextChars?: number;
}

type GeminiPart = { text?: string; thought?: boolean };
type GeminiResponse = {
  candidates?: Array<{
    finishReason?: string;
    content?: { parts?: GeminiPart[] };
  }>;
};

/** Aspoň jedna neprázdna string hodnota v metadata objekte. */
export function metadataHasNonEmptyValues(metadata: MetadataPayload): boolean {
  return Object.values(metadata).some(
    (v) => typeof v === "string" && v.trim().length > 0,
  );
}

// Gemini občas obalí JSON do markdown code fence (```json ... ```).
export function parseMetadataJson(raw: string): MetadataPayload {
  if (!raw) return {};
  let text = raw.trim();

  const fenceMatch = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) text = fenceMatch[1].trim();

  if (!text.startsWith("{")) {
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first >= 0 && last > first) {
      text = text.slice(first, last + 1);
    }
  }

  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: MetadataPayload = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof k !== "string" || k.length === 0 || k.length > 64) continue;
      if (v === null || v === undefined) {
        out[k] = null;
      } else if (typeof v === "string") {
        const trimmed = v.trim();
        out[k] = trimmed.length > 0 ? trimmed.slice(0, 500) : null;
      } else if (typeof v === "number" || typeof v === "boolean") {
        out[k] = String(v).slice(0, 500);
      }
    }
    return out;
  } catch (err) {
    console.warn("[llmMetadata] JSON parse failed:", err instanceof Error ? err.message : err);
    return {};
  }
}

function extractGeminiResponseText(data: GeminiResponse): string {
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const chunks: string[] = [];
  for (const part of parts) {
    if (part.thought === true) continue;
    const t = part.text?.trim();
    if (!t || /^THOUGHT:/i.test(t)) continue;
    chunks.push(t);
  }
  return chunks.join("\n").trim();
}

/**
 * Zreťazí OCR z najnovších LABEL fotiek (rovnaká logika ako GET /items/inventory).
 * Vracia null ak žiadny použiteľný text.
 */
export async function getLabelOcrTextForItem(
  prisma: PrismaClient,
  itemId: string,
): Promise<{ ocrText: string; photoId: string | null } | null> {
  const photos = await prisma.photo.findMany({
    where: {
      item_id: itemId,
      deleted_at: null,
      photo_type: "LABEL",
      ocr_status: "DONE",
      ocr_raw_text: { not: null },
    },
    orderBy: { created_at: "desc" },
    take: LABEL_OCR_PHOTO_TAKE,
    select: { id: true, ocr_raw_text: true },
  });

  const chunks = photos
    .map((p) => p.ocr_raw_text?.trim())
    .filter((t): t is string => !!t && t.length > 0);

  if (chunks.length === 0) return null;

  const ocrText = chunks.join("\n\n").substring(0, OCR_INPUT_MAX_CHARS);
  if (ocrText.trim().length <= 5) return null;

  return { ocrText, photoId: photos[0]?.id ?? null };
}

export async function extractMetadataFromOcr(
  ocrRawText: string,
): Promise<MetadataPayload> {
  const trimmed = ocrRawText.trim();
  if (trimmed.length <= 5) {
    throw new Error("OCR text is too short for metadata extraction");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Z nasledujúceho OCR textu slovenského stavebného štítka archívnej zložky navrhni 3–10 relevantných polí ako JSON objekt.
OCR môže obsahovať preklepy alebo chýbajúcu diakritiku — interpretuj rozumne podľa kontextu.
Kľúče v snake_case (bez diakritiky v názve kľúča). Hodnota je string alebo null.
Vyplň pole, ak je v texte aspoň čiastočná zmienka; null len ak informácia v texte vôbec nie je.
Nevymýšľaj údaje, ktoré v texte nie sú. Odpovedz LEN validný JSON objekt.

Typické polia (použi podľa obsahu štítku):
- stavba: názov objektu/stavby
- cast: časť projektu / profesia
- projektant: meno autora
- adresa: lokalita
- cislo: číslo projektu alebo výkresu
- datum: rok alebo dátum (ako na štítku)
- stupen: stupeň dokumentácie (DSP, DRS, DUR…)
- typ_dokumentu: typ dokumentácie na štítku
- investor: investor / objednávateľ

Môžeš pridať ďalšie polia, ak štítok obsahuje ďalšie jednoznačné informácie.

OCR text:
${trimmed.substring(0, OCR_INPUT_MAX_CHARS)}`,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.1,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API ${response.status}: ${await response.text()}`);
    }

    const data = (await response.json()) as GeminiResponse;
    const text = extractGeminiResponseText(data);
    if (!text) {
      const finish = data.candidates?.[0]?.finishReason ?? "unknown";
      console.warn("[llmMetadata] empty Gemini text response", { finish });
      throw new Error(`Gemini returned empty response (finishReason=${finish})`);
    }

    return parseMetadataJson(text);
  } finally {
    clearTimeout(timeout);
  }
}

export async function extractMetadataForItem(
  prisma: PrismaClient,
  itemId: string,
): Promise<LlmMetadataResult> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, deleted_at: null },
    select: { id: true },
  });
  if (!item) {
    return {
      photoId: null,
      itemId,
      metadata: null,
      error: "Item not found",
    };
  }

  const ocrBundle = await getLabelOcrTextForItem(prisma, itemId);
  if (!ocrBundle) {
    return {
      photoId: null,
      itemId,
      metadata: null,
      error: "No LABEL photo with DONE OCR text for this item",
      ocrTextChars: 0,
    };
  }

  try {
    const metadata = await extractMetadataFromOcr(ocrBundle.ocrText);
    await prisma.item.update({
      where: { id: itemId },
      data: {
        metadata: metadata as object,
        metadata_status: "EXTRACTED",
      },
    });

    return {
      photoId: ocrBundle.photoId,
      itemId,
      metadata,
      error: null,
      ocrTextChars: ocrBundle.ocrText.length,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[llmMetadata] item ${itemId} failed:`, msg);
    return {
      photoId: ocrBundle.photoId,
      itemId,
      metadata: null,
      error: msg,
      ocrTextChars: ocrBundle.ocrText.length,
    };
  }
}

// Sériový batch — Items s metadata_status = 'NONE' a LABEL OCR textom.
export async function processPendingMetadata(
  prisma: PrismaClient,
  limit: number = LLM_METADATA_BATCH_LIMIT_MAX,
): Promise<LlmMetadataResult[]> {
  const safeLimit = Math.max(1, Math.min(limit, LLM_METADATA_BATCH_LIMIT_MAX));

  type Row = { item_id: string };
  // Bez JOIN na Photo — DISTINCT nie je potrebný (EXISTS = 1 riadok per Item).
  // SELECT DISTINCT + ORDER BY updated_at by v PostgreSQL spadlo (42P10).
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT i.id AS item_id
    FROM "Item" i
    WHERE i.deleted_at IS NULL
      AND i.metadata_status = 'NONE'
      AND EXISTS (
        SELECT 1 FROM "Photo" p
        WHERE p.item_id = i.id
          AND p.deleted_at IS NULL
          AND p.photo_type = 'LABEL'
          AND p.ocr_status = 'DONE'
          AND p.ocr_raw_text IS NOT NULL
          AND length(trim(p.ocr_raw_text)) > 5
      )
    ORDER BY i.updated_at DESC
    LIMIT ${safeLimit};
  `;

  const results: LlmMetadataResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const result = await extractMetadataForItem(prisma, row.item_id);
    results.push(result);

    if (i < rows.length - 1) {
      await new Promise((r) => setTimeout(r, LLM_DELAY_MS));
    }
  }

  return results;
}
