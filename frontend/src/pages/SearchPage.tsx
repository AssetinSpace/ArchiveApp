import { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  api,
  TYPE_LABEL,
  type MatchSource,
  type PathNode,
  type SearchHit,
  type SearchResponse,
} from "../api";

// SearchPage — Sprint 4.
//
// UX:
// - Veľký input box, debounced 300ms (šetríme query roundtripy).
// - Hľadanie sa spúšťa od 2 znakov vyššie (krátke query = veľa hitov, dropujeme).
// - Výsledky ako kartičky s thumbnailom, breadcrumb-om, match source labelom a snippetom.
// - Mobile-first: na <640px sa karta skladá vertikálne; na desktop horizontálne.

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

const MATCH_LABEL: Record<MatchSource, string> = {
  name: "Nájdené v názve",
  meta_stavba: "Nájdené v metadata: Stavba",
  meta_cast: "Nájdené v metadata: Časť",
  meta_projektant: "Nájdené v metadata: Projektant",
  meta_adresa: "Nájdené v metadata: Adresa",
  meta: "Nájdené v metadátach",
  note: "Nájdené v poznámke",
  ocr: "Nájdené v OCR texte",
};

export function ItemSearchPanel({ autoFocus = false }: { autoFocus?: boolean }) {
  const [input, setInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQ(input.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [input]);

  const enabled = debouncedQ.length >= MIN_QUERY_LENGTH;

  const searchQ = useQuery<SearchResponse>({
    queryKey: ["search", debouncedQ],
    queryFn: () => api.searchItems(debouncedQ),
    enabled,
    staleTime: 30_000,
  });

  return (
    <div className="stack">
      <section className="card">
        <label className="form-label">
          Hľadaný výraz
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="napr. kolaudácia, faktúra, projekt…"
            autoFocus={autoFocus}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </label>
        <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
          Hľadá sa v názve položky, poznámke a OCR texte fotiek. Diakritika sa
          ignoruje (napr. <code>kolaudacia</code> nájde aj <code>kolaudácia</code>).
        </p>
      </section>

      {!enabled && (
        <p className="muted">
          Zadaj aspoň {MIN_QUERY_LENGTH} znaky pre spustenie hľadania.
        </p>
      )}

      {searchQ.error && (
        <p className="error">Chyba: {(searchQ.error as Error).message}</p>
      )}

      {enabled && searchQ.isLoading && <SearchSkeleton />}

      {enabled && searchQ.data && searchQ.data.hits.length === 0 && (
        <div className="card">
          <p style={{ margin: 0 }}>
            Nič sa nenašlo pre „<strong>{debouncedQ}</strong>“.
          </p>
        </div>
      )}

      {enabled && searchQ.data && searchQ.data.hits.length > 0 && (
        <>
          <p className="muted" style={{ marginTop: -4 }}>
            Nájdené {searchQ.data.count}{" "}
            {plural(searchQ.data.count, "výsledok", "výsledky", "výsledkov")}.
          </p>
          <div className="stack">
            {searchQ.data.hits.map((hit) => (
              <SearchHitCard key={hit.item.id} hit={hit} query={debouncedQ} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Hit card ────────────────────────────────────────────────────────────────

function SearchHitCard({ hit, query }: { hit: SearchHit; query: string }) {
  const itemHref = `/items/${hit.item.id}`;
  const typeLabel =
    TYPE_LABEL[hit.item.kind] ?? hit.item.kind ?? hit.item.typeCode ?? "";

  return (
    <div className="search-hit-card">
      <Link
        to={itemHref}
        className="search-hit-thumb-link"
        aria-label={`Otvoriť ${hit.item.name ?? hit.item.qrCode ?? "položku"}`}
      >
        {hit.photo ? (
          <img
            src={hit.photo.signedUrl}
            alt=""
            className="search-hit-thumb"
            loading="lazy"
          />
        ) : (
          <div className="search-hit-thumb search-hit-thumb-empty" aria-hidden="true">
            ⊟
          </div>
        )}
      </Link>

      <div className="search-hit-body">
        <BreadcrumbPath path={hit.path} />

        <Link to={itemHref} className="search-hit-title">
          <span className={`badge badge-${(hit.item.kind ?? hit.item.typeCode ?? "").toLowerCase()}`}>
            {typeLabel}
          </span>{" "}
          <span className="search-hit-name">
            {hit.item.name ?? "(bez názvu)"}
          </span>
        </Link>

        <div className="search-hit-meta-row">
          {hit.item.qrCode && (
            <span className="search-hit-qr">
              <code>{hit.item.qrCode}</code>
            </span>
          )}
          <span
            className={`badge badge-${hit.item.status.toLowerCase()}`}
          >
            {hit.item.status}
          </span>
          <span className="search-hit-match">{MATCH_LABEL[hit.matchSource]}</span>
        </div>

        {hit.matchSource === "ocr" && hit.matchSnippet && (
          <div className="search-hit-snippet">
            <HighlightedText text={hit.matchSnippet} query={query} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Breadcrumb ──────────────────────────────────────────────────────────────

function BreadcrumbPath({ path }: { path: PathNode[] }) {
  if (path.length === 0) return null;
  // Posledný node = sám item, ten v breadcrumb-e neopakujeme (je v hit title).
  const ancestors = path.slice(0, -1);
  if (ancestors.length === 0) {
    return <div className="search-hit-breadcrumb muted">(koreň)</div>;
  }
  return (
    <div className="search-hit-breadcrumb">
      {ancestors.map((node, idx) => (
        <Fragment key={node.id}>
          {idx > 0 && <span className="breadcrumb-sep">›</span>}
          <Link to={`/items/${node.id}`} className="search-hit-crumb">
            {node.name ?? TYPE_LABEL[node.kind] ?? node.kind}
          </Link>
        </Fragment>
      ))}
    </div>
  );
}

// ─── Highlight ───────────────────────────────────────────────────────────────

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Zvýrazní query v texte case+diakritika-insensitive. Zachová pôvodné znaky.
function HighlightedText({ text, query }: { text: string; query: string }) {
  const segments = useMemo(() => splitByMatch(text, query), [text, query]);
  return (
    <>
      {segments.map((seg, idx) =>
        seg.match ? (
          <mark key={idx} className="search-hit-mark">
            {seg.text}
          </mark>
        ) : (
          <span key={idx}>{seg.text}</span>
        ),
      )}
    </>
  );
}

function splitByMatch(text: string, query: string): Array<{ text: string; match: boolean }> {
  if (!query) return [{ text, match: false }];
  const normText = stripDiacritics(text);
  const normQuery = stripDiacritics(query);
  if (!normQuery) return [{ text, match: false }];

  const out: Array<{ text: string; match: boolean }> = [];
  let cursor = 0;
  while (cursor < text.length) {
    const found = normText.indexOf(normQuery, cursor);
    if (found < 0) {
      out.push({ text: text.slice(cursor), match: false });
      break;
    }
    if (found > cursor) {
      out.push({ text: text.slice(cursor, found), match: false });
    }
    out.push({ text: text.slice(found, found + normQuery.length), match: true });
    cursor = found + normQuery.length;
  }
  return out;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SearchSkeleton() {
  return (
    <div className="stack">
      {[0, 1, 2].map((i) => (
        <div key={i} className="search-hit-card">
          <div
            className="search-hit-thumb search-hit-skeleton"
            aria-hidden="true"
          />
          <div className="search-hit-body">
            <div className="search-skeleton-line" style={{ width: "60%" }} />
            <div className="search-skeleton-line" style={{ width: "85%", height: 18 }} />
            <div className="search-skeleton-line" style={{ width: "40%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── i18n helper ─────────────────────────────────────────────────────────────

function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}
