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

export interface VisionResult {
  ocr_raw_text: string;
  metadata: MetadataPayload;
}

type GeminiPart = { text?: string; thought?: boolean };
type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
  }>;
};

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
): Promise<VisionResult | null> {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");

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
      console.error(`[vision] Gemini HTTP ${response.status}:`, errBody.slice(0, 500));
      return null;
    }

    const data = (await response.json()) as GeminiResponse;
    const text = extractGeminiText(data);
    if (!text) {
      console.error("[vision] Gemini returned empty text");
      return null;
    }

    return parseVisionResponse(text);
  } catch (err) {
    console.error("[vision] Gemini call failed:", err);
    return null;
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

  const buffer = await getObjectAsBuffer(photo.storage_key);
  const base64 = buffer.toString("base64");
  const prompt = loadPrompt(photo.item.level, photo.item.kind);
  const mimeType = mimeFromStorageKey(photo.storage_key);

  const result = await callGeminiVision(prompt, base64, mimeType);
  if (!result) {
    await prisma.photo.update({
      where: { id: photo.id },
      data: { ocr_status: "FAILED", ocr_raw_text: null },
    });
    return null;
  }

  await prisma.photo.update({
    where: { id: photo.id },
    data: {
      ocr_raw_text: result.ocr_raw_text || null,
      ocr_status: "DONE",
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

    const result = await callGeminiVision(prompt, base64, mimeType);
    if (!result) {
      await prisma.photo.update({
        where: { id: photoId },
        data: { ocr_status: "FAILED", ocr_raw_text: null },
      });
      return;
    }

    const text = result.ocr_raw_text.trim();
    await prisma.photo.update({
      where: { id: photoId },
      data: { ocr_status: "DONE", ocr_raw_text: text || null },
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
    await prisma.photo
      .update({
        where: { id: photoId },
        data: { ocr_status: "FAILED", ocr_raw_text: null },
      })
      .catch(() => {});
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
        await prisma.photo.update({
          where: { id: photo.id },
          data: { ocr_status: "FAILED" },
        });
        failed++;
      }
    } catch (err) {
      console.error(`[vision] Failed photo ${photo.id}:`, err);
      await prisma.photo.update({
        where: { id: photo.id },
        data: { ocr_status: "FAILED" },
      });
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
