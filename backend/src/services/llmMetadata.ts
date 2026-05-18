// LLM metadata extraction service — Sprint 7.
//
// Metadata-only LLM workflow. Z OCR textu navrhne 3–10 relevantných polí
// ako JSONB (hybrid schéma: typické polia ako príklady, LLM môže pridať ďalšie).
// Backend ukladá všetky kľúče permisívne; konzultant review v /admin/llm-metadata.
//
// Princípy (kópia zo Sprintu 5):
// - Sériové volania, 500 ms pauza — cost control + rate limit poistka.
// - Per-call AbortController s 30 s timeoutom.
// - OCR vstup orezaný na 2000 znakov (väčšina štítkov je kratšia).
// - maxOutputTokens = 500 (JSON so 7 poliami sa pohodlne zmestí).
// - Bez GEMINI_API_KEY → throw, route handler vráti 503.

import type { PrismaClient } from "@prisma/client";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const LLM_TIMEOUT_MS = 30_000;
const LLM_DELAY_MS = 500;

export const LLM_METADATA_BATCH_LIMIT_MAX = 50;

// Odporúčané polia pre UI/export (nie povinná schéma). LLM môže vrátiť aj iné
// kľúče; tie sa uložia a v review UI sú editovateľné.
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
  photoId: string;
  itemId: string;
  metadata: MetadataPayload | null;
  error: string | null;
}

// Gemini občas obalí JSON do markdown code fence (```json ... ```), niekedy
// pridá pred/za úvodnú vetu. Skúsime niekoľko stratégií, fallback {}.
export function parseMetadataJson(raw: string): MetadataPayload {
  if (!raw) return {};
  let text = raw.trim();

  // Strip ```json fences.
  const fenceMatch = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) text = fenceMatch[1].trim();

  // Ak okolo JSON-u zvýšil text, vytiahni objekt medzi prvou { a poslednou }.
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
      // Inak ignoruj (objekty/arrays — LLM by nemal vracať, ale neriskneme).
    }
    return out;
  } catch (err) {
    console.warn("[llmMetadata] JSON parse failed:", err instanceof Error ? err.message : err);
    return {};
  }
}

export async function extractMetadataFromOcr(
  ocrRawText: string,
): Promise<MetadataPayload> {
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
                text: `Z OCR textu slovenského stavebného štítka archívnej zložky navrhni 3–10 relevantných polí ako JSON objekt.
Kľúče v snake_case (slovensky, bez diakritiky v názve kľúča). Hodnota je string alebo null.
Ak informáciu nevieš jednoznačne určiť z textu, daj null. Nevymýšľaj, nehádaj.
Odpovedz LEN validný JSON objekt — žiadny markdown, žiadny text navyše.

Typické polia (použi len ak sú v texte, inak ignoruj):
- stavba: názov objektu/stavby
- cast: časť projektu / profesia
- projektant: meno autora
- adresa: lokalita
- cislo: číslo projektu alebo výkresu
- datum: rok alebo dátum (ako na štítku)
- stupen: stupeň dokumentácie (DSP, DRS, DUR…)
- typ_dokumentu: typ dokumentácie na štítku
- investor: investor / objednávateľ

Môžeš pridať ďalšie polia, ak štítok obsahuje iné jednoznačné informácie.

OCR text:
${ocrRawText.substring(0, 2000)}`,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 800,
          temperature: 0.1,
        },
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
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    return parseMetadataJson(text);
  } finally {
    clearTimeout(timeout);
  }
}

// Sériový batch — Items s metadata_status = 'NONE' a aspoň jednou DONE OCR
// fotkou s netriviálnym textom. Per-item try/catch — chyba neukončí batch.
export async function processPendingMetadata(
  prisma: PrismaClient,
  limit: number = LLM_METADATA_BATCH_LIMIT_MAX,
): Promise<LlmMetadataResult[]> {
  const safeLimit = Math.max(1, Math.min(limit, LLM_METADATA_BATCH_LIMIT_MAX));

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
      AND i.metadata_status = 'NONE'
      AND p.deleted_at IS NULL
      AND p.ocr_status = 'DONE'
      AND p.ocr_raw_text IS NOT NULL
      AND length(trim(p.ocr_raw_text)) > 5
    ORDER BY i.id, p.created_at DESC
    LIMIT ${safeLimit};
  `;

  const results: LlmMetadataResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const metadata = await extractMetadataFromOcr(row.ocr_raw_text);

      // Aj prázdny objekt (LLM vrátil samé null) je legitímny výsledok —
      // konzultant uvidí EXTRACTED s pomlčkami a buď zamietne, alebo doplní
      // ručne. Takto neostane visieť v "eligible" fronte.
      await prisma.item.update({
        where: { id: row.item_id },
        data: {
          metadata: metadata as object,
          metadata_status: "EXTRACTED",
        },
      });

      results.push({
        photoId: row.photo_id,
        itemId: row.item_id,
        metadata,
        error: null,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[llmMetadata] item ${row.item_id} failed:`, msg);
      results.push({
        photoId: row.photo_id,
        itemId: row.item_id,
        metadata: null,
        error: msg,
      });
    }

    if (i < rows.length - 1) {
      await new Promise((r) => setTimeout(r, LLM_DELAY_MS));
    }
  }

  return results;
}
