// Gemini 2.5 Flash Vision — jeden call vráti ocr_raw_text + metadata JSONB.
// Tesseract fallback ostáva v services/ocr.ts (OCR_ENGINE=tesseract).

import { getObjectAsBuffer } from "./r2.js";
import { loadBasePrompt, loadPrompt } from "./promptLoader.js";
import {
  metadataHasNonEmptyValues,
  parseMetadataJson,
  type MetadataPayload,
} from "./llmMetadata.js";
import { prisma } from "../prisma.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const VISION_TIMEOUT_MS = 30_000;
const VISION_DELAY_MS = 500;
const OCR_ERROR_MAX = 500;

export interface VisionResult {
  ocr_raw_text: string;
  metadata: MetadataPayload;
}

export type OcrDiagnoseStep = {
  name: string;
  ok: boolean;
  detail?: string;
};

export type OcrDiagnoseReport = {
  photo_id: string;
  item_id: string;
  item_name: string | null;
  item_level: number;
  item_kind: string;
  ocr_status: string;
  photo_type: string;
  storage_key: string;
  engine: "gemini" | "tesseract";
  steps: OcrDiagnoseStep[];
  conclusion: string;
  would_succeed: boolean;
};

type GeminiPart = { text?: string; thought?: boolean };
type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
  }>;
};

type GeminiOutcome =
  | { ok: true; result: VisionResult }
  | { ok: false; error: string };

function truncateError(msg: string): string {
  const t = msg.trim();
  if (t.length <= OCR_ERROR_MAX) return t;
  return `${t.slice(0, OCR_ERROR_MAX - 3)}...`;
}

function formatThrown(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === "AbortError") return "Gemini timeout (30 s)";
    return err.message;
  }
  return String(err);
}

function parseGeminiErrorBody(status: number, errBody: string): string {
  let detail = errBody.trim().slice(0, 400);
  try {
    const j = JSON.parse(errBody) as { error?: { message?: string; status?: string } };
    if (j.error?.message) detail = j.error.message;
    else if (j.error?.status) detail = j.error.status;
  } catch {
    /* raw text */
  }
  return truncateError(`Gemini HTTP ${status}: ${detail}`);
}

function extractGeminiText(data: GeminiResponse): string {
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

function parseVisionResponse(raw: string): VisionResult | null {
  const clean = raw.replace(/```json\s?|```/g, "").trim();
  try {
    const parsed = JSON.parse(clean) as {
      ocr_raw_text?: unknown;
      metadata?: unknown;
    };
    const ocr =
      typeof parsed.ocr_raw_text === "string" ? parsed.ocr_raw_text : "";
    const metadata =
      parsed.metadata && typeof parsed.metadata === "object" && !Array.isArray(parsed.metadata)
        ? parseMetadataJson(JSON.stringify(parsed.metadata))
        : {};
    return { ocr_raw_text: ocr, metadata };
  } catch {
    const first = clean.indexOf("{");
    const last = clean.lastIndexOf("}");
    if (first >= 0 && last > first) {
      try {
        const parsed = JSON.parse(clean.slice(first, last + 1)) as {
          ocr_raw_text?: unknown;
          metadata?: unknown;
        };
        const ocr =
          typeof parsed.ocr_raw_text === "string" ? parsed.ocr_raw_text : "";
        const metadata =
          parsed.metadata &&
          typeof parsed.metadata === "object" &&
          !Array.isArray(parsed.metadata)
            ? parseMetadataJson(JSON.stringify(parsed.metadata))
            : {};
        return { ocr_raw_text: ocr, metadata };
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function callGeminiVision(
  prompt: string,
  base64: string,
  mimeType: string,
): Promise<GeminiOutcome> {
  if (!GEMINI_API_KEY) {
    return { ok: false, error: "GEMINI_API_KEY nie je nastavený na serveri" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VISION_TIMEOUT_MS);

  try {
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 4096,
          temperature: 0.1,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      const error = parseGeminiErrorBody(response.status, errBody);
      console.error(`[vision] ${error}`);
      return { ok: false, error };
    }

    const data = (await response.json()) as GeminiResponse;
    const text = extractGeminiText(data);
    if (!text) {
      const error = "Gemini vrátil prázdny text (žiadny obsah v odpovedi)";
      console.error(`[vision] ${error}`);
      return { ok: false, error };
    }

    const parsed = parseVisionResponse(text);
    if (!parsed) {
      const error = truncateError(
        `Gemini odpoveď nie je platný JSON: ${text.slice(0, 180)}`,
      );
      console.error(`[vision] ${error}`);
      return { ok: false, error };
    }

    return { ok: true, result: parsed };
  } catch (err) {
    const error = truncateError(formatThrown(err));
    console.error("[vision] Gemini call failed:", error);
    return { ok: false, error };
  } finally {
    clearTimeout(timeout);
  }
}

function mimeFromStorageKey(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

async function markPhotoFailed(photoId: string, error: string): Promise<void> {
  await prisma.photo.update({
    where: { id: photoId },
    data: {
      ocr_status: "FAILED",
      ocr_raw_text: null,
      ocr_last_error: truncateError(error),
    },
  });
}

/**
 * Jednorazová diagnostika — nemení ocr_status, len otestuje R2 + Gemini a uloží ocr_last_error.
 */
export async function diagnosePhotoVision(
  photoId: string,
): Promise<OcrDiagnoseReport | null> {
  const engine = getOcrEngine();
  const steps: OcrDiagnoseStep[] = [];

  const photo = await prisma.photo.findFirst({
    where: { id: photoId, deleted_at: null },
    include: { item: { select: { name: true, level: true, kind: true } } },
  });

  if (!photo?.item) {
    return null;
  }

  steps.push({
    name: "photo_db",
    ok: true,
    detail: `${photo.photo_type}, status=${photo.ocr_status}`,
  });

  if (engine === "tesseract") {
    steps.push({
      name: "engine",
      ok: true,
      detail: "OCR_ENGINE=tesseract — diagnostika Vision/Gemini sa preskakuje",
    });
    const conclusion =
      photo.ocr_last_error ??
      "Na serveri beží Tesseract, nie Gemini. Skontrolujte Railway logy [ocr].";
    return {
      photo_id: photo.id,
      item_id: photo.item_id,
      item_name: photo.item.name,
      item_level: photo.item.level,
      item_kind: photo.item.kind,
      ocr_status: photo.ocr_status,
      photo_type: photo.photo_type,
      storage_key: photo.storage_key,
      engine,
      steps,
      conclusion,
      would_succeed: false,
    };
  }

  if (!GEMINI_API_KEY) {
    steps.push({ name: "gemini_key", ok: false, detail: "GEMINI_API_KEY chýba" });
    return buildDiagnoseReport(photo, steps, "GEMINI_API_KEY nie je na serveri nastavený", false);
  }
  steps.push({ name: "gemini_key", ok: true });

  let buffer: Buffer;
  try {
    buffer = await getObjectAsBuffer(photo.storage_key);
    steps.push({
      name: "r2_download",
      ok: true,
      detail: `${buffer.length} bajtov, ${mimeFromStorageKey(photo.storage_key)}`,
    });
  } catch (err) {
    const detail = formatThrown(err);
    steps.push({ name: "r2_download", ok: false, detail });
    const conclusion = truncateError(`R2: ${detail}`);
    await prisma.photo
      .update({ where: { id: photoId }, data: { ocr_last_error: conclusion } })
      .catch(() => {});
    return buildDiagnoseReport(photo, steps, conclusion, false);
  }

  const prompt =
    photo.photo_type === "OVERVIEW"
      ? loadBasePrompt()
      : loadPrompt(photo.item.level, photo.item.kind);
  const base64 = buffer.toString("base64");
  const mimeType = mimeFromStorageKey(photo.storage_key);

  const outcome = await callGeminiVision(prompt, base64, mimeType);
  if (!outcome.ok) {
    steps.push({ name: "gemini_vision", ok: false, detail: outcome.error });
    await prisma.photo
      .update({ where: { id: photoId }, data: { ocr_last_error: outcome.error } })
      .catch(() => {});
    return buildDiagnoseReport(photo, steps, outcome.error, false);
  }

  steps.push({
    name: "gemini_vision",
    ok: true,
    detail: `OCR text ${outcome.result.ocr_raw_text.length} znakov`,
  });

  const conclusion = "Gemini odpoveď je v poriadku — Retry by mal prejsť (ak nie je rate limit).";
  return buildDiagnoseReport(photo, steps, conclusion, true);
}

function buildDiagnoseReport(
  photo: {
    id: string;
    item_id: string;
    storage_key: string;
    ocr_status: string;
    photo_type: string;
    item: { name: string; level: number; kind: string };
  },
  steps: OcrDiagnoseStep[],
  conclusion: string,
  would_succeed: boolean,
): OcrDiagnoseReport {
  return {
    photo_id: photo.id,
    item_id: photo.item_id,
    item_name: photo.item.name,
    item_level: photo.item.level,
    item_kind: photo.item.kind,
    ocr_status: photo.ocr_status,
    photo_type: photo.photo_type,
    storage_key: photo.storage_key,
    engine: getOcrEngine(),
    steps,
    conclusion: truncateError(conclusion),
    would_succeed,
  };
}

/**
 * Spracuje jednu LABEL fotku cez Gemini Vision.
 */
export async function processPhotoWithVision(
  photoId: string,
): Promise<VisionResult | null> {
  const photo = await prisma.photo.findFirst({
    where: { id: photoId, deleted_at: null },
    include: { item: true },
  });
  if (!photo?.item) return null;

  if (photo.ocr_status !== "PENDING") return null;

  try {
    const buffer = await getObjectAsBuffer(photo.storage_key);
    const base64 = buffer.toString("base64");
    const prompt = loadPrompt(photo.item.level, photo.item.kind);
    const mimeType = mimeFromStorageKey(photo.storage_key);

    const outcome = await callGeminiVision(prompt, base64, mimeType);
    if (!outcome.ok) {
      await markPhotoFailed(photo.id, outcome.error);
      return null;
    }

    const result = outcome.result;
    await prisma.photo.update({
      where: { id: photo.id },
      data: {
        ocr_raw_text: result.ocr_raw_text || null,
        ocr_status: "DONE",
        ocr_last_error: null,
      },
    });

    if (metadataHasNonEmptyValues(result.metadata)) {
      await prisma.item.update({
        where: { id: photo.item_id },
        data: {
          metadata: result.metadata,
          metadata_status: "EXTRACTED",
        },
      });
    }

    return result;
  } catch (err) {
    await markPhotoFailed(photo.id, formatThrown(err));
    return null;
  }
}

/**
 * L2/L3 OVERVIEW — len ocr_raw_text pre návrh názvu (metadata ignorujeme).
 */
export async function processOverviewForName(photoId: string): Promise<void> {
  try {
    const photo = await prisma.photo.findFirst({
      where: { id: photoId, deleted_at: null },
      select: {
        id: true,
        storage_key: true,
        ocr_status: true,
        photo_type: true,
        item_id: true,
        item: { select: { level: true } },
      },
    });

    if (!photo || photo.ocr_status !== "PENDING") return;
    if (photo.photo_type !== "OVERVIEW" || ![2, 3].includes(photo.item.level)) {
      return;
    }

    const buffer = await getObjectAsBuffer(photo.storage_key);
    const base64 = buffer.toString("base64");
    const prompt = loadBasePrompt();
    const mimeType = mimeFromStorageKey(photo.storage_key);

    const outcome = await callGeminiVision(prompt, base64, mimeType);
    if (!outcome.ok) {
      await markPhotoFailed(photoId, outcome.error);
      return;
    }

    const text = outcome.result.ocr_raw_text.trim();
    await prisma.photo.update({
      where: { id: photoId },
      data: { ocr_status: "DONE", ocr_raw_text: text || null, ocr_last_error: null },
    });

    const suggestion = text.trim();
    if (suggestion.length > 0 && suggestion.length < 100) {
      await prisma.item.update({
        where: { id: photo.item_id },
        data: { ocr_name_suggestion: suggestion },
      });
    }
  } catch (err) {
    console.error(`[vision] processOverviewForName ${photoId}:`, err);
    await markPhotoFailed(photoId, formatThrown(err)).catch(() => {});
  }
}

/**
 * Batch spracovanie PENDING LABEL fotiek (sériovo, 500 ms pauza).
 */
export async function processPendingVision(
  maxItems = 50,
): Promise<{ processed: number; failed: number }> {
  const pending = await prisma.photo.findMany({
    where: {
      ocr_status: "PENDING",
      photo_type: "LABEL",
      deleted_at: null,
    },
    take: maxItems,
    orderBy: { created_at: "asc" },
    select: { id: true },
  });

  let processed = 0;
  let failed = 0;

  for (const photo of pending) {
    try {
      const result = await processPhotoWithVision(photo.id);
      if (result) {
        processed++;
      } else {
        failed++;
      }
    } catch (err) {
      console.error(`[vision] Failed photo ${photo.id}:`, err);
      await markPhotoFailed(photo.id, formatThrown(err));
      failed++;
    }

    await new Promise((r) => setTimeout(r, VISION_DELAY_MS));
  }

  console.log(
    `[vision] processPendingVision: ${processed} done, ${failed} failed (of ${pending.length})`,
  );
  return { processed, failed };
}

export function getOcrEngine(): "gemini" | "tesseract" {
  const engine = (process.env.OCR_ENGINE ?? "gemini").toLowerCase();
  return engine === "tesseract" ? "tesseract" : "gemini";
}
