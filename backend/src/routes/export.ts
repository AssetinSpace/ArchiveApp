// Export routes — Sprint 4.
// GET /api/export/csv  — plochý CSV pre Excel SK (BOM, ; separator, CRLF)
// GET /api/export/json — hierarchický strom SKLAD → PALETA → KRABICA → ZLOZKA
//
// Princípy:
// - Soft-deleted items NEzobrazujeme (export = aktuálny stav, deletes ostávajú
//   len v DB pre audit).
// - JSON export NEobsahuje signed URLs — sú efemérne (15 min). Konzument použije
//   storage_key pri stiahnutí R2 bucket-u cez rclone (viď PROJECT.md §11).
// - Všetko load-neme dvomi queriami a strom postavíme v pamäti — pre ~5000
//   items je to << 100 MB a < 1s. Žiadne streaming komplikácie.
//
// Auth: chránené basicAuth middlewarom v index.ts.

import { Router } from "express";
import { prisma } from "../prisma.js";

export const exportRouter: Router = Router();

type ExportPhoto = {
  id: string;
  storageKey: string;
  ocrRawText: string | null;
  ocrStatus: string;
  photoType: string;
  createdAt: Date;
};

type ExportItem = {
  id: string;
  level: number;
  kind: string;
  name: string;
  name_source: string;
  type_code: string | null;
  auto_name: string | null;
  metadata: unknown;
  metadata_status: string;
  parent_id: string | null;
  qr_code: string | null;
  note: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayIso(): string {
  // YYYY-MM-DD v UTC — konzistentné cez timezones, vhodné do názvu súboru.
  return new Date().toISOString().slice(0, 10);
}

// CSV escape pre RFC 4180 + Excel SK (; separator):
// - ak hodnota obsahuje ; alebo " alebo CR/LF → wrap do "...", inner " → ""
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s === "") return "";
  if (/[;"\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function joinCsvRow(cells: unknown[]): string {
  return cells.map(csvEscape).join(";");
}

// Postaví Map<id, Item> a Map<id, name> pre rýchly path lookup.
function indexItems(items: ExportItem[]): Map<string, ExportItem> {
  const map = new Map<string, ExportItem>();
  for (const item of items) map.set(item.id, item);
  return map;
}

// Vráti pole názvov od koreňa po item (vrátane).
// Ak chýba meno, použije type_code (napr. "PALETA").
// Bezpečné voči cyklom — seen set.
function buildPath(item: ExportItem, byId: Map<string, ExportItem>): string[] {
  const names: string[] = [];
  let cursor: ExportItem | undefined = item;
  const seen = new Set<string>();
  while (cursor) {
    if (seen.has(cursor.id)) break;
    seen.add(cursor.id);
    names.unshift(cursor.name ?? cursor.kind);
    if (!cursor.parent_id) break;
    cursor = byId.get(cursor.parent_id);
  }
  return names;
}

function groupPhotosByItem(
  photos: Array<ExportPhoto & { item_id: string }>,
): Map<string, ExportPhoto[]> {
  const map = new Map<string, ExportPhoto[]>();
  for (const p of photos) {
    const list = map.get(p.item_id);
    const photo: ExportPhoto = {
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

// ─── Loaders ─────────────────────────────────────────────────────────────────

async function loadActiveItems(): Promise<ExportItem[]> {
  const items = await prisma.item.findMany({
    where: { deleted_at: null },
    orderBy: { created_at: "asc" },
    select: {
      id: true,
      level: true,
      kind: true,
      name: true,
      name_source: true,
      type_code: true,
      auto_name: true,
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
    type_code: i.type_code,
    auto_name: i.auto_name,
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

async function loadActivePhotos(): Promise<Array<ExportPhoto & { item_id: string }>> {
  // Najnovšie prvé — pri groupingu sa zachová toto poradie, takže prvý element
  // v poli per-item bude najnovší. Pre CSV ocrTextPreview chceme najnovší
  // DONE text — vyfiltrujeme priamo v generateCsv.
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

// ─── CSV ─────────────────────────────────────────────────────────────────────

exportRouter.get("/csv", async (_req, res, next) => {
  try {
    const [items, photos] = await Promise.all([loadActiveItems(), loadActivePhotos()]);
    const byId = indexItems(items);
    const photosByItem = groupPhotosByItem(photos);

    const header = joinCsvRow([
      "id",
      "qrCode",
      "name",
      "level",
      "kind",
      "nameSource",
      "metadataStatus",
      "metadataJson",
      "metaStavba",
      "metaCast",
      "metaProjektant",
      "metaAdresa",
      "metaCislo",
      "metaDatum",
      "metaStupen",
      "note",
      "status",
      "path",
      "photoCount",
      "labelPhotoCount",
      "overviewPhotoCount",
      "hasOcrText",
      "ocrTextPreview",
      "createdAt",
      "updatedAt",
    ]);

    const lines: string[] = [header];
    for (const item of items) {
      const photoList = photosByItem.get(item.id) ?? [];
      const photoCount = photoList.length;
      const labelPhotoCount = photoList.filter((p) => p.photoType === "LABEL").length;
      const overviewPhotoCount = photoList.filter((p) => p.photoType === "OVERVIEW").length;
      // OCR text preview čítame len z LABEL fotiek — OVERVIEW nikdy nemá text
      // a defenzívne sa vyhneme prípadu kde by sa do exportu dostal text z
      // nesprávne klasifikovanej fotky.
      const firstDoneWithText = photoList.find(
        (p) =>
          p.photoType === "LABEL" &&
          p.ocrStatus === "DONE" &&
          p.ocrRawText &&
          p.ocrRawText.trim() !== "",
      );
      const hasOcrText = firstDoneWithText ? "true" : "false";
      const ocrTextPreview = firstDoneWithText
        ? (firstDoneWithText.ocrRawText ?? "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 100)
        : "";
      const path = buildPath(item, byId).join(" > ");
      // 7 plochých stĺpcov pre časté polia + metadataJson pre dynamické kľúče.
      const meta = (item.metadata ?? {}) as Record<string, unknown>;
      const metaCell = (key: string): string => {
        const v = meta[key];
        return typeof v === "string" ? v : "";
      };
      const metadataJson =
        meta && typeof meta === "object" && Object.keys(meta).length > 0
          ? JSON.stringify(meta)
          : "";
      lines.push(
        joinCsvRow([
          item.id,
          item.qr_code ?? "",
          item.name,
          item.level,
          item.kind,
          item.name_source,
          item.metadata_status,
          metadataJson,
          metaCell("stavba"),
          metaCell("cast"),
          metaCell("projektant"),
          metaCell("adresa"),
          metaCell("cislo"),
          metaCell("datum"),
          metaCell("stupen"),
          item.note ?? "",
          item.status,
          path,
          photoCount,
          labelPhotoCount,
          overviewPhotoCount,
          hasOcrText,
          ocrTextPreview,
          item.created_at.toISOString(),
          item.updated_at.toISOString(),
        ]),
      );
    }

    // UTF-8 BOM (\uFEFF) aby Excel SK rozpoznal kódovanie.
    // CRLF konce riadkov — Excel SK to chce.
    const body = "\uFEFF" + lines.join("\r\n") + "\r\n";

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="archiveapp-export-${todayIso()}.csv"`,
    );
    res.send(body);
  } catch (e) {
    next(e);
  }
});

// ─── JSON ────────────────────────────────────────────────────────────────────

type JsonNode = {
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
  created_at: string;
  updated_at: string;
  photos: Array<{
    id: string;
    storageKey: string;
    ocrRawText: string | null;
    ocrStatus: string;
    photoType: string;
    createdAt: string;
  }>;
  children: JsonNode[];
};

exportRouter.get("/json", async (_req, res, next) => {
  try {
    const [items, photos] = await Promise.all([loadActiveItems(), loadActivePhotos()]);
    const photosByItem = groupPhotosByItem(photos);

    // Postavíme uzly v jednom prechode + zoskupíme deti podľa parent_id.
    const nodeById = new Map<string, JsonNode>();
    for (const item of items) {
      const photoList = photosByItem.get(item.id) ?? [];
      // V exporte chceme chronologicky najstaršie prvé (intuitívne pre čitanie).
      const photosSerialized = photoList
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
      nodeById.set(item.id, {
        id: item.id,
        level: item.level,
        kind: item.kind,
        name: item.name,
        name_source: item.name_source,
        metadata: item.metadata,
        metadata_status: item.metadata_status,
        parent_id: item.parent_id,
        qr_code: item.qr_code,
        note: item.note,
        status: item.status,
        created_at: item.created_at.toISOString(),
        updated_at: item.updated_at.toISOString(),
        photos: photosSerialized,
        children: [],
      });
    }

    const roots: JsonNode[] = [];
    for (const node of nodeById.values()) {
      if (node.parent_id === null) {
        roots.push(node);
      } else {
        const parent = nodeById.get(node.parent_id);
        if (parent) parent.children.push(node);
        else roots.push(node);
      }
    }

    // Stabilné poradie: koreň podľa name (Sklad A/B/C), deti podľa created_at.
    const sortChildren = (n: JsonNode): void => {
      n.children.sort((a, b) => {
        const an = a.name ?? "";
        const bn = b.name ?? "";
        if (an !== bn) return an.localeCompare(bn, "sk");
        return a.created_at.localeCompare(b.created_at);
      });
      n.children.forEach(sortChildren);
    };
    roots.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "sk"));
    roots.forEach(sortChildren);

    const body = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        itemCount: items.length,
        photoCount: photos.length,
        roots,
      },
      null,
      2,
    );

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="archiveapp-export-${todayIso()}.json"`,
    );
    res.send(body);
  } catch (e) {
    next(e);
  }
});
