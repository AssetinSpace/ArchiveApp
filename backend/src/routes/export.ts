// Export routes — Sprint 4 + column picker.
// GET  /api/export/columns — katalóg stĺpcov (metadata keys z inventára)
// GET  /api/export/csv|json — full export (spätná kompatibilita)
// POST /api/export/csv|json — export s výberom stĺpcov { columns?, format? }

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import {
  buildExportCatalog,
  buildFlatRow,
  buildItemExportContext,
  buildTreeNodeFields,
  discoverMetadataKeys,
  ExportColumnsError,
  generateCsvBody,
  resolveExportColumns,
  type ExportItemRow,
  type ExportJsonFormat,
  type ExportPhotoRow,
} from "../services/exportColumns.js";

export const exportRouter: Router = Router();

const exportBodySchema = z.object({
  columns: z.array(z.string().min(1)).optional(),
  format: z.enum(["tree", "flat"]).optional(),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function indexItems(items: ExportItemRow[]): Map<string, ExportItemRow> {
  const map = new Map<string, ExportItemRow>();
  for (const item of items) map.set(item.id, item);
  return map;
}

function buildPath(item: ExportItemRow, byId: Map<string, ExportItemRow>): string {
  const names: string[] = [];
  let cursor: ExportItemRow | undefined = item;
  const seen = new Set<string>();
  while (cursor) {
    if (seen.has(cursor.id)) break;
    seen.add(cursor.id);
    names.unshift(cursor.name ?? cursor.kind);
    if (!cursor.parent_id) break;
    cursor = byId.get(cursor.parent_id);
  }
  return names.join(" > ");
}

function groupPhotosByItem(
  photos: Array<ExportPhotoRow & { item_id: string }>,
): Map<string, ExportPhotoRow[]> {
  const map = new Map<string, ExportPhotoRow[]>();
  for (const p of photos) {
    const list = map.get(p.item_id);
    const photo: ExportPhotoRow = {
      id: p.id,
      storageKey: p.storageKey,
      ocrRawText: p.ocrRawText,
      ocrStatus: p.ocrStatus,
      photoType: p.photoType,
      createdAt: p.createdAt,
    };
    if (list) list.push(photo);
    else map.set(p.item_id, [photo]);
  }
  return map;
}

async function loadActiveItems(): Promise<ExportItemRow[]> {
  const items = await prisma.item.findMany({
    where: { deleted_at: null },
    orderBy: { created_at: "asc" },
    select: {
      id: true,
      level: true,
      kind: true,
      name: true,
      name_source: true,
      metadata: true,
      metadata_status: true,
      parent_id: true,
      qr_code: true,
      note: true,
      status: true,
      created_at: true,
      updated_at: true,
    },
  });
  return items.map((i) => ({
    id: i.id,
    level: i.level,
    kind: i.kind,
    name: i.name,
    name_source: i.name_source,
    metadata: i.metadata,
    metadata_status: i.metadata_status,
    parent_id: i.parent_id,
    qr_code: i.qr_code,
    note: i.note,
    status: String(i.status),
    created_at: i.created_at,
    updated_at: i.updated_at,
  }));
}

async function loadActivePhotos(): Promise<Array<ExportPhotoRow & { item_id: string }>> {
  const photos = await prisma.photo.findMany({
    where: { deleted_at: null },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      item_id: true,
      storage_key: true,
      ocr_raw_text: true,
      ocr_status: true,
      photo_type: true,
      created_at: true,
    },
  });
  return photos.map((p) => ({
    id: p.id,
    item_id: p.item_id,
    storageKey: p.storage_key,
    ocrRawText: p.ocr_raw_text,
    ocrStatus: String(p.ocr_status),
    photoType: String(p.photo_type),
    createdAt: p.created_at,
  }));
}

type ExportData = {
  items: ExportItemRow[];
  photos: Array<ExportPhotoRow & { item_id: string }>;
  byId: Map<string, ExportItemRow>;
  photosByItem: Map<string, ExportPhotoRow[]>;
  metadataKeys: string[];
  catalog: ReturnType<typeof buildExportCatalog>;
};

async function loadExportData(): Promise<ExportData> {
  const [items, photos] = await Promise.all([loadActiveItems(), loadActivePhotos()]);
  const metadataKeys = discoverMetadataKeys(items);
  const catalog = buildExportCatalog(metadataKeys);
  return {
    items,
    photos,
    byId: indexItems(items),
    photosByItem: groupPhotosByItem(photos),
    metadataKeys,
    catalog,
  };
}

function makeContextGetter(
  data: ExportData,
): (item: ExportItemRow) => ReturnType<typeof buildItemExportContext> {
  return (item) => {
    const photoList = data.photosByItem.get(item.id) ?? [];
    const path = buildPath(item, data.byId);
    return buildItemExportContext(item, photoList, path);
  };
}

function sendExportError(res: import("express").Response, e: unknown, next: (err: unknown) => void) {
  if (e instanceof ExportColumnsError) {
    res.status(400).json({ error: e.message });
    return;
  }
  next(e);
}

// ─── GET /columns ────────────────────────────────────────────────────────────

exportRouter.get("/columns", async (_req, res, next) => {
  try {
    const data = await loadExportData();
    res.json({
      columns: data.catalog,
      metadataKeys: data.metadataKeys,
    });
  } catch (e) {
    next(e);
  }
});

// ─── CSV ─────────────────────────────────────────────────────────────────────

function runCsvExport(
  data: ExportData,
  columns: ReturnType<typeof resolveExportColumns>,
): string {
  const getContext = makeContextGetter(data);
  return generateCsvBody(data.items, columns, getContext);
}

exportRouter.get("/csv", async (_req, res, next) => {
  try {
    const data = await loadExportData();
    const columns = resolveExportColumns(undefined, data.catalog);
    const body = runCsvExport(data, columns);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="archiveapp-export-${todayIso()}.csv"`,
    );
    res.send(body);
  } catch (e) {
    sendExportError(res, e, next);
  }
});

exportRouter.post("/csv", async (req, res, next) => {
  try {
    const parsed = exportBodySchema.parse(req.body ?? {});
    const data = await loadExportData();
    const columns = resolveExportColumns(parsed.columns, data.catalog);
    if (columns.length === 0) {
      res.status(400).json({ error: "Vyber aspoň jeden stĺpec." });
      return;
    }
    const body = runCsvExport(data, columns);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="archiveapp-export-${todayIso()}.csv"`,
    );
    res.send(body);
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", issues: e.issues });
      return;
    }
    sendExportError(res, e, next);
  }
});

// ─── JSON ────────────────────────────────────────────────────────────────────

type JsonTreeNode = Record<string, unknown> & {
  children: JsonTreeNode[];
};

function buildJsonTree(
  data: ExportData,
  columns: ReturnType<typeof resolveExportColumns>,
): JsonTreeNode[] {
  const getContext = makeContextGetter(data);
  const nodeById = new Map<string, JsonTreeNode>();

  for (const item of data.items) {
    const ctx = getContext(item);
    const fields = buildTreeNodeFields(item, columns, ctx);
    nodeById.set(item.id, {
      ...fields,
      children: [],
    });
  }

  const roots: JsonTreeNode[] = [];
  for (const item of data.items) {
    const node = nodeById.get(item.id)!;
    if (item.parent_id === null) {
      roots.push(node);
    } else {
      const parent = nodeById.get(item.parent_id);
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
  }

  const sortChildren = (n: JsonTreeNode): void => {
    n.children.sort((a, b) => {
      const an = String(a.name ?? "");
      const bn = String(b.name ?? "");
      if (an !== bn) return an.localeCompare(bn, "sk");
      return String(a.created_at ?? "").localeCompare(String(b.created_at ?? ""));
    });
    n.children.forEach(sortChildren);
  };
  roots.sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? ""), "sk"));
  roots.forEach(sortChildren);
  return roots;
}

function buildJsonFlat(
  data: ExportData,
  columns: ReturnType<typeof resolveExportColumns>,
): Record<string, unknown>[] {
  const getContext = makeContextGetter(data);
  return data.items.map((item) => buildFlatRow(item, columns, getContext(item)));
}

function runJsonExport(
  data: ExportData,
  columns: ReturnType<typeof resolveExportColumns>,
  format: ExportJsonFormat,
): string {
  const payload =
    format === "flat"
      ? {
          exportedAt: new Date().toISOString(),
          format: "flat",
          itemCount: data.items.length,
          photoCount: data.photos.length,
          columns: columns.map((c) => ({ id: c.id, label: c.label })),
          rows: buildJsonFlat(data, columns),
        }
      : {
          exportedAt: new Date().toISOString(),
          format: "tree",
          itemCount: data.items.length,
          photoCount: data.photos.length,
          columns: columns.map((c) => ({ id: c.id, label: c.label })),
          roots: buildJsonTree(data, columns),
        };
  return JSON.stringify(payload, null, 2);
}

function sendJson(res: import("express").Response, body: string) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="archiveapp-export-${todayIso()}.json"`,
  );
  res.send(body);
}

exportRouter.get("/json", async (_req, res, next) => {
  try {
    const data = await loadExportData();
    const columns = resolveExportColumns(undefined, data.catalog);
    sendJson(res, runJsonExport(data, columns, "tree"));
  } catch (e) {
    sendExportError(res, e, next);
  }
});

exportRouter.post("/json", async (req, res, next) => {
  try {
    const parsed = exportBodySchema.parse(req.body ?? {});
    const data = await loadExportData();
    const columns = resolveExportColumns(parsed.columns, data.catalog);
    if (columns.length === 0) {
      res.status(400).json({ error: "Vyber aspoň jeden stĺpec." });
      return;
    }
    const format: ExportJsonFormat = parsed.format ?? "tree";
    sendJson(res, runJsonExport(data, columns, format));
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", issues: e.issues });
      return;
    }
    sendExportError(res, e, next);
  }
});
