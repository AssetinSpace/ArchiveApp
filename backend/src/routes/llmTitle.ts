// LLM title extraction endpoints — Sprint 5.
//
// Mount: app.use("/api/llm-title", basicAuth, llmTitleRouter) v index.ts.
//
// Workflow:
//  1) POST /process       → spustí batch (Gemini 2.5 Flash), uloží SUGGESTED
//  2) GET  /pending-review → vráti SUGGESTED položky (s thumbnail + breadcrumb)
//  3) POST /:id/confirm   → name = ocr_title, status = CONFIRMED
//  4) POST /:id/reject    → status = REJECTED, name nezmenený
//  5) POST /:id/edit      → ocr_title = body, name = body, status = CONFIRMED
//
// Conflict policy (Sprint 5 design call):
// - confirm/edit NEKONTROLUJÚ checkNameConflict — duplicitné OCR názvy povolené
//   (auto_name + UUID stále unique). Ručný POST/PATCH check ostáva.

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import {
  extractTitleFromOcr,
  processPendingTitles,
  LLM_BATCH_LIMIT_MAX,
  type LlmTitleResult,
} from "../services/llmTitle.js";
import { getItemPath } from "../lib/itemPath.js";
import { getSignedUrlForKey } from "../services/r2.js";

export const llmTitleRouter: Router = Router();

const NO_API_KEY_MSG =
  "LLM title extraction is not configured. Set GEMINI_API_KEY in Railway Variables.";

function hasApiKey(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

// ─── POST /api/llm-title/process ──────────────────────────────────────────────
//
// Synchrónne spustenie batch-u. Beh trvá ~limit * (LLM_call + 500 ms) — pri
// limit=50 to je ~50 × (~3s + 0.5s) ≈ 175s. Express default request timeout
// je 2 min, Railway proxy ~5 min. Pre MVP v poho.
//
// Konzultant zvyčajne púšťa batche s rozumnejším limitom (10–20) keď manuálne
// reviewuje. Veľký batch je voliteľný.

const ProcessSchema = z.object({
  limit: z.number().int().min(1).max(LLM_BATCH_LIMIT_MAX).optional(),
});

llmTitleRouter.post("/process", async (req, res, next) => {
  try {
    if (!hasApiKey()) {
      res.status(503).json({ error: NO_API_KEY_MSG });
      return;
    }

    const body = ProcessSchema.parse(req.body ?? {});
    const limit = body.limit ?? LLM_BATCH_LIMIT_MAX;

    const results: LlmTitleResult[] = await processPendingTitles(prisma, limit);

    res.json({ processed: results.length, results });
  } catch (e) {
    next(e);
  }
});

// ─── GET /api/llm-title/status ────────────────────────────────────────────────

llmTitleRouter.get("/status", async (_req, res, next) => {
  try {
    // Per-status counts cez groupBy.
    const grouped = await prisma.item.groupBy({
      by: ["ocr_title_status"],
      where: { deleted_at: null },
      _count: { _all: true },
    });

    let none = 0;
    let suggested = 0;
    let confirmed = 0;
    let rejected = 0;
    for (const g of grouped) {
      const c = g._count._all;
      switch (g.ocr_title_status) {
        case "NONE":
          none = c;
          break;
        case "SUGGESTED":
          suggested = c;
          break;
        case "CONFIRMED":
          confirmed = c;
          break;
        case "REJECTED":
          rejected = c;
          break;
      }
    }
    const total = none + suggested + confirmed + rejected;

    // eligible = NONE + má aspoň jednu DONE OCR fotku s neprázdnym textom.
    // Použijeme rovnaký filter ako processPendingTitles — DISTINCT na Item.id.
    type EligibleRow = { count: bigint };
    const eligibleRows = await prisma.$queryRaw<EligibleRow[]>`
      SELECT COUNT(DISTINCT i.id) AS count
      FROM "Item" i
      JOIN "Photo" p ON p.item_id = i.id
      WHERE i.deleted_at IS NULL
        AND i.ocr_title_status = 'NONE'
        AND p.deleted_at IS NULL
        AND p.ocr_status = 'DONE'
        AND p.ocr_raw_text IS NOT NULL
        AND length(trim(p.ocr_raw_text)) > 5;
    `;
    const eligible = Number(eligibleRows[0]?.count ?? 0);

    res.json({
      total,
      none,
      eligible,
      suggested,
      confirmed,
      rejected,
      noApiKey: !process.env.GEMINI_API_KEY,
    });
  } catch (e) {
    next(e);
  }
});

// ─── GET /api/llm-title/pending-review ────────────────────────────────────────

const PendingQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

llmTitleRouter.get("/pending-review", async (req, res, next) => {
  try {
    const q = PendingQuerySchema.parse(req.query);
    const limit = q.limit ?? 20;
    const offset = q.offset ?? 0;

    const items = await prisma.item.findMany({
      where: {
        deleted_at: null,
        ocr_title_status: "SUGGESTED",
      },
      orderBy: { updated_at: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        type_code: true,
        name: true,
        auto_name: true,
        ocr_title: true,
        ocr_title_status: true,
        parent_id: true,
        qr_code: true,
        updated_at: true,
      },
    });

    const total = await prisma.item.count({
      where: { deleted_at: null, ocr_title_status: "SUGGESTED" },
    });

    // Najnovšia DONE foto per item — DISTINCT ON (item_id) batched query.
    const itemIds = items.map((i) => i.id);
    type ThumbRow = { item_id: string; storage_key: string };
    const thumbs: ThumbRow[] = itemIds.length
      ? await prisma.$queryRaw<ThumbRow[]>`
          SELECT DISTINCT ON (item_id) item_id, storage_key
          FROM "Photo"
          WHERE item_id = ANY(${itemIds}::text[])
            AND deleted_at IS NULL
            AND ocr_status = 'DONE'
          ORDER BY item_id, created_at DESC;
        `
      : [];
    const thumbByItem = new Map(thumbs.map((t) => [t.item_id, t.storage_key]));

    // Path enrichment + signed URLs paralelne.
    const enriched = await Promise.all(
      items.map(async (it) => {
        const path = await getItemPath(it.id);
        const key = thumbByItem.get(it.id);
        const photo = key
          ? { storageKey: key, signedUrl: await getSignedUrlForKey(key, 900) }
          : null;
        return {
          id: it.id,
          typeCode: it.type_code,
          name: it.name,
          autoName: it.auto_name,
          ocrTitle: it.ocr_title,
          ocrTitleStatus: it.ocr_title_status,
          qrCode: it.qr_code,
          path,
          photo,
        };
      }),
    );

    res.json({ total, limit, offset, items: enriched });
  } catch (e) {
    next(e);
  }
});

// ─── POST /api/llm-title/:itemId/confirm ──────────────────────────────────────

llmTitleRouter.post("/:itemId/confirm", async (req, res, next) => {
  try {
    const itemId = req.params.itemId;
    const existing = await prisma.item.findFirst({
      where: { id: itemId, deleted_at: null },
      select: { id: true, ocr_title: true, ocr_title_status: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    if (!existing.ocr_title) {
      res.status(400).json({ error: "Item has no ocr_title to confirm" });
      return;
    }

    const updated = await prisma.item.update({
      where: { id: itemId },
      data: {
        name: existing.ocr_title,
        ocr_title_status: "CONFIRMED",
      },
      include: { parent: true },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

// ─── POST /api/llm-title/:itemId/reject ───────────────────────────────────────

llmTitleRouter.post("/:itemId/reject", async (req, res, next) => {
  try {
    const itemId = req.params.itemId;
    const existing = await prisma.item.findFirst({
      where: { id: itemId, deleted_at: null },
      select: { id: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    const updated = await prisma.item.update({
      where: { id: itemId },
      data: { ocr_title_status: "REJECTED" },
      include: { parent: true },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

// ─── POST /api/llm-title/:itemId/edit ─────────────────────────────────────────

const EditSchema = z.object({
  title: z.string().trim().min(1).max(200),
});

llmTitleRouter.post("/:itemId/edit", async (req, res, next) => {
  try {
    const itemId = req.params.itemId;
    const body = EditSchema.parse(req.body);
    const existing = await prisma.item.findFirst({
      where: { id: itemId, deleted_at: null },
      select: { id: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    const updated = await prisma.item.update({
      where: { id: itemId },
      data: {
        ocr_title: body.title,
        name: body.title,
        ocr_title_status: "CONFIRMED",
      },
      include: { parent: true },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

// extractTitleFromOcr re-export pre prípad budúceho real-time use case.
export { extractTitleFromOcr };
