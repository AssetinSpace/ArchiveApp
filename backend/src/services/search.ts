// Fulltext search service — Sprint 4 + metadata-only (Sprint 7+).
//
// Match v: name, note, metadata JSONB (všetky kľúče), Photo.ocr_raw_text.
// Priorita: name > suggested meta polia > generic meta > note > ocr.

import { prisma } from "../prisma.js";
import { getItemPath, type PathNode } from "../lib/itemPath.js";
import { getSignedUrlForKey } from "./r2.js";

export type MatchSource =
  | "name"
  | "meta_stavba"
  | "meta_cast"
  | "meta_projektant"
  | "meta_adresa"
  | "meta"
  | "note"
  | "ocr";

export type SearchHit = {
  item: {
    id: string;
    level: number;
    kind: string;
    typeCode: string | null;
    name: string;
    qrCode: string | null;
    status: string;
    note: string | null;
  };
  path: PathNode[];
  matchSource: MatchSource;
  matchSnippet: string | null;
  photo: { storageKey: string; signedUrl: string } | null;
};

type SearchRow = {
  id: string;
  level: number;
  kind: string;
  type_code: string | null;
  name: string;
  note: string | null;
  qr_code: string | null;
  status: string;
  updated_at: Date;
  match_source: MatchSource;
  meta_stavba: string | null;
  meta_cast: string | null;
  meta_projektant: string | null;
  meta_adresa: string | null;
  matched_meta_key: string | null;
  matched_meta_value: string | null;
};

type ThumbRow = { item_id: string; storage_key: string };

type OcrTextRow = { item_id: string; ocr_raw_text: string | null };

function stripDiacritics(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function extractSnippet(fullText: string, query: string, window = 80): string | null {
  if (!fullText || !query) return null;
  const normText = stripDiacritics(fullText);
  const normQuery = stripDiacritics(query);
  const idx = normText.indexOf(normQuery);
  if (idx < 0) return null;
  const start = Math.max(0, idx - window);
  const end = Math.min(fullText.length, idx + normQuery.length + window);
  let snippet = fullText.slice(start, end);
  snippet = snippet.replace(/\s+/g, " ").trim();
  if (start > 0) snippet = "… " + snippet;
  if (end < fullText.length) snippet = snippet + " …";
  return snippet;
}

export async function searchItems(query: string, limit: number): Promise<SearchHit[]> {
  const like = `%${query}%`;

  let rows: SearchRow[];
  try {
    rows = await prisma.$queryRaw<SearchRow[]>`
      SELECT i.id, i.level, i.kind, i.type_code, i.name, i.note, i.qr_code,
        i.status::text AS status, i.updated_at,
        i.metadata->>'stavba' AS meta_stavba,
        i.metadata->>'cast' AS meta_cast,
        i.metadata->>'projektant' AS meta_projektant,
        i.metadata->>'adresa' AS meta_adresa,
        (
          SELECT kv.key
          FROM jsonb_each_text(COALESCE(i.metadata, '{}'::jsonb)) kv
          WHERE trim(kv.value) <> ''
            AND strip_diacritics(kv.value) LIKE strip_diacritics(${like})
            AND kv.key NOT IN ('stavba', 'cast', 'projektant', 'adresa')
          ORDER BY kv.key
          LIMIT 1
        ) AS matched_meta_key,
        (
          SELECT kv.value
          FROM jsonb_each_text(COALESCE(i.metadata, '{}'::jsonb)) kv
          WHERE trim(kv.value) <> ''
            AND strip_diacritics(kv.value) LIKE strip_diacritics(${like})
            AND kv.key NOT IN ('stavba', 'cast', 'projektant', 'adresa')
          ORDER BY kv.key
          LIMIT 1
        ) AS matched_meta_value,
        CASE
          WHEN strip_diacritics(i.name) LIKE strip_diacritics(${like}) THEN 'name'
          WHEN strip_diacritics(i.metadata->>'stavba') LIKE strip_diacritics(${like}) THEN 'meta_stavba'
          WHEN strip_diacritics(i.metadata->>'cast') LIKE strip_diacritics(${like}) THEN 'meta_cast'
          WHEN strip_diacritics(i.metadata->>'projektant') LIKE strip_diacritics(${like}) THEN 'meta_projektant'
          WHEN strip_diacritics(i.metadata->>'adresa') LIKE strip_diacritics(${like}) THEN 'meta_adresa'
          WHEN EXISTS (
            SELECT 1 FROM jsonb_each_text(COALESCE(i.metadata, '{}'::jsonb)) kv
            WHERE trim(kv.value) <> ''
              AND strip_diacritics(kv.value) LIKE strip_diacritics(${like})
          ) THEN 'meta'
          WHEN strip_diacritics(i.note) LIKE strip_diacritics(${like}) THEN 'note'
          ELSE 'ocr'
        END AS match_source
      FROM "Item" i
      WHERE i.deleted_at IS NULL
        AND (
          strip_diacritics(i.name) LIKE strip_diacritics(${like})
          OR strip_diacritics(i.kind) LIKE strip_diacritics(${like})
          OR strip_diacritics(i.metadata->>'stavba') LIKE strip_diacritics(${like})
          OR strip_diacritics(i.metadata->>'cast') LIKE strip_diacritics(${like})
          OR strip_diacritics(i.metadata->>'projektant') LIKE strip_diacritics(${like})
          OR strip_diacritics(i.metadata->>'adresa') LIKE strip_diacritics(${like})
          OR EXISTS (
            SELECT 1 FROM jsonb_each_text(COALESCE(i.metadata, '{}'::jsonb)) kv
            WHERE trim(kv.value) <> ''
              AND strip_diacritics(kv.value) LIKE strip_diacritics(${like})
          )
          OR strip_diacritics(i.note) LIKE strip_diacritics(${like})
          OR EXISTS (
            SELECT 1 FROM "Photo" p
            WHERE p.item_id = i.id AND p.deleted_at IS NULL
              AND strip_diacritics(p.ocr_raw_text) LIKE strip_diacritics(${like})
          )
        )
      ORDER BY i.updated_at DESC
      LIMIT ${limit};
    `;
  } catch (err) {
    console.error("[search] main query failed:", {
      query,
      limit,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  if (rows.length === 0) return [];

  const hitIds = rows.map((r) => r.id);

  let thumbs: ThumbRow[];
  try {
    thumbs = await prisma.$queryRaw<ThumbRow[]>`
      SELECT DISTINCT ON (item_id) item_id, storage_key
      FROM "Photo"
      WHERE item_id = ANY(${hitIds}::text[]) AND deleted_at IS NULL
      ORDER BY item_id, created_at DESC;
    `;
  } catch (err) {
    console.error("[search] thumbnails query failed:", {
      hitIdsCount: hitIds.length,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
  const thumbByItem = new Map<string, string>(thumbs.map((t) => [t.item_id, t.storage_key]));

  const ocrHitIds = rows.filter((r) => r.match_source === "ocr").map((r) => r.id);
  let ocrTextByItem = new Map<string, string>();
  if (ocrHitIds.length > 0) {
    try {
      const ocrRows = await prisma.$queryRaw<OcrTextRow[]>`
        SELECT DISTINCT ON (item_id) item_id, ocr_raw_text
        FROM "Photo"
        WHERE item_id = ANY(${ocrHitIds}::text[])
          AND deleted_at IS NULL
          AND ocr_raw_text IS NOT NULL
          AND strip_diacritics(ocr_raw_text) LIKE strip_diacritics(${like})
        ORDER BY item_id, created_at DESC;
      `;
      ocrTextByItem = new Map(ocrRows.map((r) => [r.item_id, r.ocr_raw_text ?? ""]));
    } catch (err) {
      console.error("[search] OCR snippet query failed:", {
        ocrHitIdsCount: ocrHitIds.length,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const paths = await Promise.all(rows.map((r) => getItemPath(r.id)));

  const signedUrls = await Promise.all(
    rows.map(async (r) => {
      const key = thumbByItem.get(r.id);
      if (!key) return null;
      const url = await getSignedUrlForKey(key, 900);
      return { storageKey: key, signedUrl: url };
    }),
  );

  return rows.map((r, idx) => {
    let snippet: string | null = null;
    if (r.match_source === "ocr") {
      snippet = extractSnippet(ocrTextByItem.get(r.id) ?? "", query);
    } else if (r.match_source === "meta_stavba") {
      snippet = extractSnippet(r.meta_stavba ?? "", query);
    } else if (r.match_source === "meta_cast") {
      snippet = extractSnippet(r.meta_cast ?? "", query);
    } else if (r.match_source === "meta_projektant") {
      snippet = extractSnippet(r.meta_projektant ?? "", query);
    } else if (r.match_source === "meta_adresa") {
      snippet = extractSnippet(r.meta_adresa ?? "", query);
    } else if (r.match_source === "meta") {
      snippet = extractSnippet(r.matched_meta_value ?? "", query);
    }

    return {
      item: {
        id: r.id,
        level: r.level,
        kind: r.kind,
        typeCode: r.type_code,
        name: r.name,
        qrCode: r.qr_code,
        status: r.status,
        note: r.note,
      },
      path: paths[idx],
      matchSource: r.match_source,
      matchSnippet: snippet,
      photo: signedUrls[idx],
    };
  });
}
