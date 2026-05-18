// LLM metadata extraction endpoints — Sprint 7.
//
// Mount: app.use("/api/llm-metadata", basicAuth, llmMetadataRouter) v index.ts.
//
// Workflow metadata-only (JSONB hybrid schéma):
//  1) POST /process        → spustí batch (Gemini), uloží metadata + EXTRACTED
//  2) GET  /status         → counts per status + eligible + noApiKey flag
//  3) GET  /pending-review → vráti EXTRACTED items s thumbnail/breadcrumb
//  4) POST /:id/confirm    → metadata_status = REVIEWED (NEpíše do name)
//  5) POST /:id/edit       → prepíše metadata (status sa nemení)
//  6) POST /:id/reject     → metadata = {}, metadata_status = NONE (clean state)
//
// Validácia metadata payload je permisívna — ukladáme aj neznáme kľúče
// (forward-compat). Známe kľúče logujeme bez warning, neznáme s warning.

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import {
  extractMetadataFromOcr,
  processPendingMetadata,
  KNOWN_METADATA_KEYS,
  LLM_METADATA_BATCH_LIMIT_MAX,
  type LlmMetadataResult,
  type MetadataPayload,
} from "../services/llmMetadata.js";
import { getItemPath } from "../lib/itemPath.js";
import { getSignedUrlForKey } from "../services/r2.js";

export const llmMetadataRouter: Router = Router();

const NO_API_KEY_MSG =
  "LLM metadata extraction is not configured. Set GEMINI_API_KEY in Railway Variables.";

function hasApiKey(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

// Permisívna metadata schéma — ukladáme akékoľvek kľúče (forward-compat),
// neznáme zalogujeme. Hodnota môže byť string (max 500 znakov) alebo null.
const MetadataValueSchema = z.union([z.string().max(500), z.null()]);
const MetadataObjectSchema = z
  .record(z.string().min(1).max(64), MetadataValueSchema)
  .transform((obj) => {
    const knownSet = new Set<string>(KNOWN_METADATA_KEYS);
    const unknown = Object.keys(obj).filter((k) => !knownSet.has(k));
    if (unknown.length > 0) {
      console.warn("[llmMetadata] storing unknown metadata keys:", unknown);
    }
    return obj as MetadataPayload;
  });

// ─── POST /api/llm-metadata/process ───────────────────────────────────────────

const ProcessSchema = z.object({
  limit: z.number().int().min(1).max(LLM_METADATA_BATCH_LIMIT_MAX).optional(),
});

llmMetadataRouter.post("/process", async (req, res, next) => {
  try {
    if (!hasApiKey()) {
      res.status(503).json({ error: NO_API_KEY_MSG });
      return;
    }

    const body = ProcessSchema.parse(req.body ?? {});
    const limit = body.limit ?? LLM_METADATA_BATCH_LIMIT_MAX;

    const results: LlmMetadataResult[] = await processPendingMetadata(prisma, limit);

    res.json({ processed: results.length, results });
  } catch (e) {
    next(e);
  }
});

// ─── GET /api/llm-metadata/status ─────────────────────────────────────────────

llmMetadataRouter.get("/status", async (_req, res, next) => {
  try {
    const grouped = await prisma.item.groupBy({
      by: ["metadata_status"],
      where: { deleted_at: null },
      _count: { _all: true },
    });

    let none = 0;
    let extracted = 0;
    let reviewed = 0;
    for (const g of grouped) {
      const c = g._count._all;
      switch (g.metadata_status) {
        case "NONE":
          none = c;
          break;
        case "EXTRACTED":
          extracted = c;
          break;
        case "REVIEWED":
          reviewed = c;
          break;
      }
    }
    const total = none + extracted + reviewed;

    type EligibleRow = { count: bigint };
    const eligibleRows = await prisma.$queryRaw<EligibleRow[]>`
      SELECT COUNT(DISTINCT i.id) AS count
      FROM "Item" i
      JOIN "Photo" p ON p.item_id = i.id
      WHERE i.deleted_at IS NULL
        AND i.metadata_status = 'NONE'
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
      extracted,
      reviewed,
      noApiKey: !process.env.GEMINI_API_KEY,
    });
  } catch (e) {
    next(e);
  }
});

// ─── GET /api/llm-metadata/pending-review ─────────────────────────────────────

const PendingQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

llmMetadataRouter.get("/pending-review", async (req, res, next) => {
  try {
    const q = PendingQuerySchema.parse(req.query);
    const limit = q.limit ?? 20;
    const offset = q.offset ?? 0;

    const items = await prisma.item.findMany({
      where: {
        deleted_at: null,
        metadata_status: "EXTRACTED",
      },
      orderBy: { updated_at: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        type_code: true,
        name: true,
        auto_name: true,
        metadata: true,
        metadata_status: true,
        parent_id: true,
        qr_code: true,
        updated_at: true,
      },
    });

    const total = await prisma.item.count({
      where: { deleted_at: null, metadata_status: "EXTRACTED" },
    });

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
          metadata: (it.metadata ?? {}) as MetadataPayload,
          metadataStatus: it.metadata_status,
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

// ─── POST /api/llm-metadata/:itemId/confirm ───────────────────────────────────

const ConfirmSchema = z.object({
  metadata: MetadataObjectSchema.optional(),
});

llmMetadataRouter.post("/:itemId/confirm", async (req, res, next) => {
  try {
    const itemId = req.params.itemId;
    const body = ConfirmSchema.parse(req.body ?? {});

    const existing = await prisma.item.findFirst({
      where: { id: itemId, deleted_at: null },
      select: { id: true, metadata: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    const finalMetadata =
      body.metadata !== undefined ? body.metadata : (existing.metadata ?? {});

    const updated = await prisma.item.update({
      where: { id: itemId },
      data: {
        metadata: finalMetadata as object,
        metadata_status: "REVIEWED",
      },
      include: { parent: true },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

// ─── POST /api/llm-metadata/:itemId/edit ──────────────────────────────────────

const EditSchema = z.object({
  metadata: MetadataObjectSchema,
});

llmMetadataRouter.post("/:itemId/edit", async (req, res, next) => {
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
      data: { metadata: body.metadata as object },
      include: { parent: true },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

// ─── POST /api/llm-metadata/:itemId/reject ────────────────────────────────────

llmMetadataRouter.post("/:itemId/reject", async (req, res, next) => {
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
      data: {
        metadata: {} as object,
        metadata_status: "NONE",
      },
      include: { parent: true },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

export { extractMetadataFromOcr };
