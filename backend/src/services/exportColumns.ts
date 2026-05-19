// Export column catalog — metadata keys as flat columns, user-selectable export.
import { KNOWN_METADATA_KEYS } from "./llmMetadata.js";

export type ExportColumnGroup = "item" | "metadata" | "photos" | "technical";

export type ExportColumnDef = {
  id: string;
  label: string;
  group: ExportColumnGroup;
};

export type ExportJsonFormat = "tree" | "flat";

export type ExportItemRow = {
  id: string;
  level: number;
  kind: string;
  name: string;
  name_source: string;
  metadata: unknown;
  metadata_status: string;
  parent_id: string | null;
  qr_code: string | null;
  note: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
};

export type ExportPhotoRow = {
  id: string;
  storageKey: string;
  ocrRawText: string | null;
  ocrStatus: string;
  photoType: string;
  createdAt: Date;
};

export type ItemExportContext = {
  path: string;
  photoList: ExportPhotoRow[];
  photoCount: number;
  labelPhotoCount: number;
  overviewPhotoCount: number;
  hasOcrText: boolean;
  ocrTextPreview: string;
};

const METADATA_LABELS: Record<string, string> = {
  stavba: "Stavba",
  cast: "Časť",
  projektant: "Projektant",
  adresa: "Adresa",
  cislo: "Číslo",
  datum: "Dátum",
  stupen: "Stupeň",
  typ_dokumentu: "Typ dokumentu",
  investor: "Investor",
  autor_casti: "Autor časti",
};

const BASE_COLUMNS: ExportColumnDef[] = [
  { id: "id", label: "ID", group: "item" },
  { id: "qr_code", label: "QR", group: "item" },
  { id: "name", label: "Názov", group: "item" },
  { id: "level", label: "Úroveň", group: "item" },
  { id: "kind", label: "Typ", group: "item" },
  { id: "name_source", label: "Zdroj názvu", group: "item" },
  { id: "metadata_status", label: "Meta status", group: "item" },
  { id: "note", label: "Poznámka", group: "item" },
  { id: "status", label: "Status", group: "item" },
  { id: "path", label: "Cesta", group: "item" },
  { id: "photo_count", label: "Počet fotiek", group: "photos" },
  { id: "label_photo_count", label: "LABEL fotiek", group: "photos" },
  { id: "overview_photo_count", label: "OVERVIEW fotiek", group: "photos" },
  { id: "has_ocr_text", label: "Má OCR text", group: "photos" },
  { id: "ocr_text_preview", label: "Náhľad OCR", group: "photos" },
  { id: "photos", label: "Fotky (detail)", group: "photos" },
  { id: "created_at", label: "Vytvorené", group: "technical" },
  { id: "updated_at", label: "Upravené", group: "technical" },
  { id: "metadata_json", label: "Surové metadata (JSON)", group: "technical" },
];

function metadataFieldLabel(key: string): string {
  return METADATA_LABELS[key] ?? key.replace(/_/g, " ");
}

export function discoverMetadataKeys(items: ExportItemRow[]): string[] {
  const knownSet = new Set<string>(KNOWN_METADATA_KEYS);
  const extra = new Set<string>();
  for (const item of items) {
    const meta = item.metadata;
    if (!meta || typeof meta !== "object" || Array.isArray(meta)) continue;
    for (const k of Object.keys(meta as Record<string, unknown>)) {
      if (typeof k === "string" && k.trim() && !knownSet.has(k)) extra.add(k);
    }
  }
  const extras = [...extra].sort((a, b) => a.localeCompare(b, "sk"));
  return [...KNOWN_METADATA_KEYS, ...extras];
}

export function buildExportCatalog(metadataKeys: string[]): ExportColumnDef[] {
  const metaCols: ExportColumnDef[] = metadataKeys.map((key) => ({
    id: `meta_${key}`,
    label: metadataFieldLabel(key),
    group: "metadata",
  }));
  return [...BASE_COLUMNS, ...metaCols];
}

export function resolveExportColumns(
  requested: string[] | undefined,
  catalog: ExportColumnDef[],
): ExportColumnDef[] {
  if (!requested || requested.length === 0) return catalog;
  const byId = new Map(catalog.map((c) => [c.id, c]));
  const unknown = requested.filter((id) => !byId.has(id));
  if (unknown.length > 0) {
    throw new ExportColumnsError(`Neznáme stĺpce: ${unknown.join(", ")}`);
  }
  return requested.map((id) => byId.get(id)!);
}

export class ExportColumnsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExportColumnsError";
  }
}

function metaRecord(item: ExportItemRow): Record<string, unknown> {
  const m = item.metadata;
  if (m && typeof m === "object" && !Array.isArray(m)) return m as Record<string, unknown>;
  return {};
}

function metaString(item: ExportItemRow, key: string): string {
  const v = metaRecord(item)[key];
  return typeof v === "string" ? v : "";
}

export function buildItemExportContext(
  item: ExportItemRow,
  photoList: ExportPhotoRow[],
  path: string,
): ItemExportContext {
  const photoCount = photoList.length;
  const labelPhotoCount = photoList.filter((p) => p.photoType === "LABEL").length;
  const overviewPhotoCount = photoList.filter((p) => p.photoType === "OVERVIEW").length;
  const firstDoneWithText = photoList.find(
    (p) =>
      p.photoType === "LABEL" &&
      p.ocrStatus === "DONE" &&
      p.ocrRawText &&
      p.ocrRawText.trim() !== "",
  );
  const hasOcrText = !!firstDoneWithText;
  const ocrTextPreview = firstDoneWithText
    ? (firstDoneWithText.ocrRawText ?? "").replace(/\s+/g, " ").trim().slice(0, 100)
    : "";
  return {
    path,
    photoList,
    photoCount,
    labelPhotoCount,
    overviewPhotoCount,
    hasOcrText,
    ocrTextPreview,
  };
}

function serializePhotos(photoList: ExportPhotoRow[]): Array<{
  id: string;
  storageKey: string;
  ocrRawText: string | null;
  ocrStatus: string;
  photoType: string;
  createdAt: string;
}> {
  return photoList
    .slice()
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((p) => ({
      id: p.id,
      storageKey: p.storageKey,
      ocrRawText: p.ocrRawText,
      ocrStatus: p.ocrStatus,
      photoType: p.photoType,
      createdAt: p.createdAt.toISOString(),
    }));
}

export function getColumnValue(
  columnId: string,
  item: ExportItemRow,
  ctx: ItemExportContext,
): unknown {
  if (columnId.startsWith("meta_")) {
    return metaString(item, columnId.slice(5));
  }
  switch (columnId) {
    case "id":
      return item.id;
    case "qr_code":
      return item.qr_code ?? "";
    case "name":
      return item.name;
    case "level":
      return item.level;
    case "kind":
      return item.kind;
    case "name_source":
      return item.name_source;
    case "metadata_status":
      return item.metadata_status;
    case "note":
      return item.note ?? "";
    case "status":
      return item.status;
    case "path":
      return ctx.path;
    case "photo_count":
      return ctx.photoCount;
    case "label_photo_count":
      return ctx.labelPhotoCount;
    case "overview_photo_count":
      return ctx.overviewPhotoCount;
    case "has_ocr_text":
      return ctx.hasOcrText ? "true" : "false";
    case "ocr_text_preview":
      return ctx.ocrTextPreview;
    case "photos":
      return serializePhotos(ctx.photoList);
    case "created_at":
      return item.created_at.toISOString();
    case "updated_at":
      return item.updated_at.toISOString();
    case "metadata_json": {
      const meta = metaRecord(item);
      return Object.keys(meta).length > 0 ? JSON.stringify(meta) : "";
    }
    default:
      return "";
  }
}

/** Flat row keyed by column id (for JSON flat + internal use). */
export function buildFlatRow(
  item: ExportItemRow,
  columns: ExportColumnDef[],
  ctx: ItemExportContext,
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const col of columns) {
    row[col.id] = getColumnValue(col.id, item, ctx);
  }
  return row;
}

const TREE_FIELD_IDS = new Set([
  "id",
  "qr_code",
  "name",
  "level",
  "kind",
  "name_source",
  "metadata_status",
  "note",
  "status",
  "created_at",
  "updated_at",
  "metadata_json",
]);

/** Build filtered tree node; metadata keys expand to top-level fields on node. */
export function buildTreeNodeFields(
  item: ExportItemRow,
  columns: ExportColumnDef[],
  ctx: ItemExportContext,
): Record<string, unknown> {
  const selected = new Set(columns.map((c) => c.id));
  const node: Record<string, unknown> = {};

  for (const col of columns) {
    if (col.id === "photos") {
      node.photos = serializePhotos(ctx.photoList);
      continue;
    }
    if (col.id === "path") {
      node.path = ctx.path;
      continue;
    }
    if (col.id.startsWith("meta_")) {
      const key = col.id.slice(5);
      node[key] = metaString(item, key) || null;
      continue;
    }
    if (TREE_FIELD_IDS.has(col.id)) {
      const v = getColumnValue(col.id, item, ctx);
      if (col.id === "metadata_json") {
        const meta = metaRecord(item);
        node.metadata = Object.keys(meta).length > 0 ? meta : {};
      } else if (col.id === "created_at" || col.id === "updated_at") {
        node[col.id] = String(v);
      } else if (col.id === "qr_code") {
        node.qr_code = item.qr_code;
      } else {
        node[col.id] = v;
      }
    } else if (
      col.id === "photo_count" ||
      col.id === "label_photo_count" ||
      col.id === "overview_photo_count" ||
      col.id === "has_ocr_text" ||
      col.id === "ocr_text_preview"
    ) {
      node[col.id] = getColumnValue(col.id, item, ctx);
    }
  }

  // parent_id useful for tree consumers when id selected
  if (selected.has("id") && !("parent_id" in node)) {
    node.parent_id = item.parent_id;
  }

  return node;
}

export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s =
    typeof value === "object" ? JSON.stringify(value) : String(value);
  if (s === "") return "";
  if (/[;"\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function joinCsvRow(cells: unknown[]): string {
  return cells.map(csvEscape).join(";");
}

export function generateCsvBody(
  items: ExportItemRow[],
  columns: ExportColumnDef[],
  getContext: (item: ExportItemRow) => ItemExportContext,
): string {
  const header = joinCsvRow(columns.map((c) => c.label));
  const lines: string[] = [header];
  for (const item of items) {
    const ctx = getContext(item);
    const cells = columns.map((col) => getColumnValue(col.id, item, ctx));
    lines.push(joinCsvRow(cells));
  }
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}
