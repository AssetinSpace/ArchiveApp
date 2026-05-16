import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, TYPE_LABEL, type QRTag, type QrStatus } from "../api";

type Filter = "ALL" | QrStatus;

export function QRAdminPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generateOpen, setGenerateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const tagsQ = useQuery({
    queryKey: ["qr", "list", filter],
    queryFn: () =>
      api.qrList(filter === "ALL" ? undefined : { status: filter }),
  });

  const tags = tagsQ.data ?? [];

  // Vyfiltruj selection na aktuálne zobrazené (po zmene filtra zmiznú zo selection
  // tie, ktoré tu nie sú — ale pre print to nevadí, máme len kódy).
  const visibleCodes = useMemo(() => new Set(tags.map((t) => t.code)), [tags]);
  const selectedVisible = useMemo(
    () => Array.from(selected).filter((c) => visibleCodes.has(c)),
    [selected, visibleCodes],
  );

  function toggle(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }
  function toggleAll() {
    if (selectedVisible.length === tags.length) {
      // Odznač všetko z aktuálne viditeľných.
      setSelected((prev) => {
        const next = new Set(prev);
        tags.forEach((t) => next.delete(t.code));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        tags.forEach((t) => next.add(t.code));
        return next;
      });
    }
  }

  function refresh() {
    qc.invalidateQueries({ queryKey: ["qr"] });
  }

  return (
    <div className="stack">
      <h1>QR Admin</h1>

      {/* Generovať — accordion, default zbalené */}
      <section className="card">
        <button
          type="button"
          className="accordion-header"
          onClick={() => setGenerateOpen((v) => !v)}
          aria-expanded={generateOpen}
        >
          Generovať QR kódy
          <span className="accordion-header-arrow">{generateOpen ? "▲" : "▼"}</span>
        </button>
        {generateOpen && (
          <div style={{ marginTop: 16 }}>
            <GenerateForm onDone={refresh} />
          </div>
        )}
      </section>

      {/* Importovať — accordion, default zbalené */}
      <section className="card">
        <button
          type="button"
          className="accordion-header"
          onClick={() => setImportOpen((v) => !v)}
          aria-expanded={importOpen}
        >
          Importovať existujúce kódy
          <span className="accordion-header-arrow">{importOpen ? "▲" : "▼"}</span>
        </button>
        {importOpen && (
          <div style={{ marginTop: 16 }}>
            <ImportForm onDone={refresh} />
          </div>
        )}
      </section>

      {/* Zoznam QR kódov — vždy viditeľný */}
      <section className="card">
        <h2 style={{ marginBottom: 16 }}>Zoznam QR kódov</h2>
        <div
          className="row"
          style={{
            justifyContent: "space-between",
            marginBottom: 12,
            alignItems: "flex-end",
          }}
        >
          <label className="form-label" style={{ flex: "1 1 180px", maxWidth: 240 }}>
            Filter
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as Filter)}
            >
              <option value="ALL">Všetky</option>
              <option value="FREE">Voľné (FREE)</option>
              <option value="ASSIGNED">Priradené (ASSIGNED)</option>
            </select>
          </label>
          <PrintButton selectedCodes={selectedVisible} />
        </div>

        {tagsQ.isLoading && <p className="muted">Načítavam…</p>}
        {tagsQ.error && (
          <p className="error">Chyba: {(tagsQ.error as Error).message}</p>
        )}
        {!tagsQ.isLoading && tags.length === 0 && (
          <p className="muted">Žiadne QR kódy. Vygeneruj alebo importuj prvé.</p>
        )}

        {tags.length > 0 && (
          <div className="scrollable-x">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      checked={
                        tags.length > 0 && selectedVisible.length === tags.length
                      }
                      onChange={toggleAll}
                      style={{ width: 20, height: 20, minHeight: 0 }}
                      aria-label="Označiť všetky"
                    />
                  </th>
                  <th>Kód</th>
                  <th>Status</th>
                  <th>Priradená položka</th>
                  <th>Akcie</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => (
                  <QRRow
                    key={tag.id}
                    tag={tag}
                    checked={selected.has(tag.code)}
                    onToggle={() => toggle(tag.code)}
                    onChanged={refresh}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted" style={{ marginTop: 8 }}>
          Vybrané: {selectedVisible.length} / {tags.length}
        </p>
      </section>
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function QRRow({
  tag,
  checked,
  onToggle,
  onChanged,
}: {
  tag: QRTag;
  checked: boolean;
  onToggle: () => void;
  onChanged: () => void;
}) {
  const unassignMut = useMutation({
    mutationFn: () => api.qrUnassign(tag.code),
    onSuccess: () => onChanged(),
  });

  return (
    <tr>
      <td>
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          style={{ width: 20, height: 20, minHeight: 0 }}
          aria-label={`Označiť ${tag.code}`}
        />
      </td>
      <td style={{ fontFamily: "monospace" }}>{tag.code}</td>
      <td>
        <span className={`badge badge-${tag.status.toLowerCase()}`}>
          {tag.status}
        </span>
      </td>
      <td>
        {tag.assigned_item ? (
          <Link to={`/items/${tag.assigned_item.id}`}>
            <span
              className={`badge badge-${tag.assigned_item.type_code.toLowerCase()}`}
              style={{ marginRight: 6 }}
            >
              {TYPE_LABEL[tag.assigned_item.type_code] ?? tag.assigned_item.type_code}
            </span>
            {tag.assigned_item.name ?? "(bez názvu)"}
          </Link>
        ) : (
          <span className="muted">—</span>
        )}
      </td>
      <td>
        {tag.status === "ASSIGNED" && (
          <button
            type="button"
            className="btn-small btn-danger"
            disabled={unassignMut.isPending}
            onClick={() => {
              if (confirm(`Uvoľniť QR ${tag.code}?`)) unassignMut.mutate();
            }}
          >
            {unassignMut.isPending ? "…" : "Uvoľniť"}
          </button>
        )}
        {unassignMut.error && (
          <div className="error" style={{ fontSize: 12 }}>
            {(unassignMut.error as Error).message}
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── Generate form ────────────────────────────────────────────────────────────

function GenerateForm({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState<number>(10);
  const [prefix, setPrefix] = useState<string>("QR");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () =>
      api.qrGenerate({ count, prefix: prefix.trim() || undefined }),
    onSuccess: (tags) => {
      setError(null);
      setResult(
        `Vygenerované ${tags.length} kódov: ${tags[0]?.code ?? "—"} až ${
          tags[tags.length - 1]?.code ?? "—"
        }`,
      );
      onDone();
    },
    onError: (e: Error) => {
      setError(e.message);
      setResult(null);
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (count < 1 || count > 500) {
      setError("Počet musí byť 1–500");
      return;
    }
    mut.mutate();
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="row" style={{ gap: 12, alignItems: "flex-end" }}>
        <label className="form-label" style={{ flex: "1 1 100px", maxWidth: 140 }}>
          Počet
          <input
            type="number"
            min={1}
            max={500}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            required
          />
        </label>
        <label className="form-label" style={{ flex: "1 1 100px", maxWidth: 180 }}>
          Prefix
          <input
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="QR"
          />
        </label>
      </div>
      {error && <div className="error">{error}</div>}
      {result && <div className="success">{result}</div>}
      <button type="submit" className="btn-primary" disabled={mut.isPending}>
        {mut.isPending ? "Generujem…" : "Generovať"}
      </button>
    </form>
  );
}

// ─── Import form ──────────────────────────────────────────────────────────────

function ImportForm({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () => {
      const codes = text
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      return api.qrImport({ codes });
    },
    onSuccess: (r) => {
      setError(null);
      setResult(`Vytvorené: ${r.created}, preskočené: ${r.skipped}`);
      setText("");
      onDone();
    },
    onError: (e: Error) => {
      setError(e.message);
      setResult(null);
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const codes = text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (codes.length === 0) {
      setError("Pridaj aspoň jeden kód");
      return;
    }
    mut.mutate();
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <label className="form-label">
        Kódy (jeden per riadok)
        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"QR-000001\nQR-000002\n..."}
        />
      </label>
      {error && <div className="error">{error}</div>}
      {result && <div className="success">{result}</div>}
      <button type="submit" className="btn-primary" disabled={mut.isPending}>
        {mut.isPending ? "Importujem…" : "Importovať"}
      </button>
    </form>
  );
}

// ─── Print button ─────────────────────────────────────────────────────────────

function PrintButton({ selectedCodes }: { selectedCodes: string[] }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setError(null);
    if (selectedCodes.length === 0) return;
    setBusy(true);
    try {
      const blob = await api.qrPrintBlob(selectedCodes);
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (!win) {
        // Popup blokovaný — fallback na download link.
        const a = document.createElement("a");
        a.href = url;
        a.download = "qr-labels.pdf";
        a.click();
      }
      // Necháme URL vyčistený po krátkej dobe (browser to zatiaľ musí mať otvorené).
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      <button
        type="button"
        className="btn-primary"
        onClick={onClick}
        disabled={selectedCodes.length === 0 || busy}
      >
        {busy ? "Generujem PDF…" : `Tlačiť vybrané (${selectedCodes.length})`}
      </button>
      {error && <div className="error" style={{ marginTop: 4 }}>{error}</div>}
    </div>
  );
}
