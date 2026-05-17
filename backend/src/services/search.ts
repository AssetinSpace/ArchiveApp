// Fulltext search service — Sprint 4.
//
// Princípy (PROJECT.md §10 + Sprint 4 spec):
// - PostgreSQL ILIKE cez 3 polia (Item.name, Item.note, Photo.ocr_raw_text)
//   stačí pre ~5000 záznamov. Žiadny ElasticSearch, žiadny tsvector teraz.
// - Diakritika-insensitive cez `unaccent` contrib extension (viď migráciu
//   20260517120000_add_unaccent_extension). Normalizuje sa query aj porovnávané
//   polia: unaccent(lower(...)) LIKE unaccent(lower(...)).
// - Match source priorita: name > note > ocr (jeden source per hit), rieši
//   sa cez SQL CASE WHEN.
// - Soft-deleted items NEzobrazujeme (deleted_at IS NULL na oboch tabuľkách).
// - Limit hard-capnutý v route na 1–200; default 50.
// - Path enrichment cez existujúce getItemPath (zopár dotazov per hit pre 50
//   hitov × ~4 ancestrov je OK). Thumbnail enrichment batchovaný cez
//   DISTINCT ON aby sme nevolali N+1.

import { prisma } from "../prisma.js";
import { getItemPath, type PathNode } from "../lib/itemPath.js";
import { getSignedUrlForKey } from "./r2.js";

export type MatchSource = "name" | "note" | "ocr";

export type SearchHit = {
  item: {
    id: string;
    typeCode: string;
    name: string | null;
    qrCode: string | null;
    status: string;
    note: string | null;
  };
  path: PathNode[];
  matchSource: MatchSource;
  matchSnippet: string | null;
  photo: { storageKey: string; signedUrl: string } | null;
};

// SQL row shape vrátený raw queriou — pomenovania v snake_case (PostgreSQL).
type SearchRow = {
  id: string;
  type_code: string;
  name: string | null;
  note: string | null;
  qr_code: string | null;
  status: string;
  updated_at: Date;
  match_source: MatchSource;
};

type ThumbRow = { item_id: string; storage_key: string };

type OcrTextRow = { item_id: string; ocr_raw_text: string | null };

// JS verzia toho čo robí Postgres unaccent(lower(...)) — používame ju len
// pri extrakcii snippetu, aby sme našli prvý výskyt match-u v OCR texte
// case+diacritics-insensitive. SQL search už predtým potvrdil že match existuje.
function stripDiacritics(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Vytiahne ±80 znakov okolo prvého výskytu query v origináli (zachová pôvodnú
// diakritiku/case textu), prefixne/suffixne `…` ak je text orezaný.
function extractSnippet(fullText: string, query: string, window = 80): string | null {
  if (!fullText || !query) return null;
  const normText = stripDiacritics(fullText);
  const normQuery = stripDiacritics(query);
  const idx = normText.indexOf(normQuery);
  if (idx < 0) return null;
  const start = Math.max(0, idx - window);
  const end = Math.min(fullText.length, idx + normQuery.length + window);
  let snippet = fullText.slice(start, end);
  // Normalize whitespace pre čitateľnosť na FE.
  snippet = snippet.replace(/\s+/g, " ").trim();
  if (start > 0) snippet = "… " + snippet;
  if (end < fullText.length) snippet = snippet + " …";
  return snippet;
}

/**
 * Nájde Items kde query matchne v name, note alebo ocr_raw_text aspoň jednej
 * aktívnej fotky. Vracia hits zoradené podľa updated_at DESC, max `limit`.
 * Query sa pred porovnaním unaccent-uje a lowercase-uje na oboch stranách.
 */
export async function searchItems(query: string, limit: number): Promise<SearchHit[]> {
  // `like` ide do Postgresu ako parameter; LIKE pattern dáme priamo (s %).
  // Vstup z route je už trim-nutý a min 2 znaky; tu len lowercase + wrap.
  const like = `%${query.toLowerCase()}%`;

  // Hlavný hit query: jediný pass cez Item s EXISTS na Photo.
  // Match source priorita name > note > ocr riešená cez CASE.
  // Tagged template literal s ${} vkladá hodnoty ako bezpečné parametre
  // (Prisma robí escape — žiadny SQL injection risk).
  const rows = await prisma.$queryRaw<SearchRow[]>`
    SELECT i.id, i.type_code, i.name, i.note, i.qr_code, i.status::text AS status, i.updated_at,
      CASE
        WHEN unaccent(lower(coalesce(i.name, ''))) LIKE unaccent(${like}) THEN 'name'
        WHEN unaccent(lower(coalesce(i.note, ''))) LIKE unaccent(${like}) THEN 'note'
        ELSE 'ocr'
      END AS match_source
    FROM "Item" i
    WHERE i.deleted_at IS NULL
      AND (
        unaccent(lower(coalesce(i.name, ''))) LIKE unaccent(${like})
        OR unaccent(lower(coalesce(i.note, ''))) LIKE unaccent(${like})
        OR EXISTS (
          SELECT 1 FROM "Photo" p
          WHERE p.item_id = i.id AND p.deleted_at IS NULL
            AND unaccent(lower(coalesce(p.ocr_raw_text, ''))) LIKE unaccent(${like})
        )
      )
    ORDER BY i.updated_at DESC
    LIMIT ${limit};
  `;

  if (rows.length === 0) return [];

  const hitIds = rows.map((r) => r.id);

  // Batched thumbnail fetch: najnovšia ne-deleted fotka per item.
  // DISTINCT ON (item_id) s ORDER BY item_id, created_at DESC vyberie 1 riadok
  // per item — najnovší (server-side sort).
  const thumbs = await prisma.$queryRaw<ThumbRow[]>`
    SELECT DISTINCT ON (item_id) item_id, storage_key
    FROM "Photo"
    WHERE item_id = ANY(${hitIds}::uuid[]) AND deleted_at IS NULL
    ORDER BY item_id, created_at DESC;
  `;
  const thumbByItem = new Map<string, string>(thumbs.map((t) => [t.item_id, t.storage_key]));

  // Pre OCR hity vytiahneme najnovší DONE OCR text aby sme mohli extrahovať snippet.
  // Filtrujeme len na items kde match_source = 'ocr' (pre name/note nepotrebujeme).
  const ocrHitIds = rows.filter((r) => r.match_source === "ocr").map((r) => r.id);
  let ocrTextByItem = new Map<string, string>();
  if (ocrHitIds.length > 0) {
    const ocrRows = await prisma.$queryRaw<OcrTextRow[]>`
      SELECT DISTINCT ON (item_id) item_id, ocr_raw_text
      FROM "Photo"
      WHERE item_id = ANY(${ocrHitIds}::uuid[])
        AND deleted_at IS NULL
        AND ocr_raw_text IS NOT NULL
        AND unaccent(lower(ocr_raw_text)) LIKE unaccent(${like})
      ORDER BY item_id, created_at DESC;
    `;
    ocrTextByItem = new Map(ocrRows.map((r) => [r.item_id, r.ocr_raw_text ?? ""]));
  }

  // Paths — sériovo (getItemPath robí walk hore cez parent_id, ~4 dotazy per hit).
  // Mohli by sme to paralelizovať Promise.all, ale 50 × 4 = 200 sériovo je
  // stále < 1s a šetríme connection pool. Ak bude pomalé → TD.
  const paths = await Promise.all(rows.map((r) => getItemPath(r.id)));

  // Signed URLs paralelne — getSignedUrlForKey nerobí I/O do R2 (len HMAC sign),
  // ale Promise.all je čistejší zápis.
  const signedUrls = await Promise.all(
    rows.map(async (r) => {
      const key = thumbByItem.get(r.id);
      if (!key) return null;
      const url = await getSignedUrlForKey(key, 900);
      return { storageKey: key, signedUrl: url };
    }),
  );

  return rows.map((r, idx) => {
    const snippet =
      r.match_source === "ocr"
        ? extractSnippet(ocrTextByItem.get(r.id) ?? "", query)
        : null;
    return {
      item: {
        id: r.id,
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
