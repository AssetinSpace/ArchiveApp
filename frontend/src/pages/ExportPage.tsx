import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, type ExportJsonFormat, type ExportKind } from "../api";
import { ExportColumnsModal } from "../components/ExportColumnsModal";

const TOAST_MS = 3000;

export function ExportPage() {
  const [toast, setToast] = useState<string | null>(null);
  const [modalKind, setModalKind] = useState<ExportKind | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const exportMut = useMutation({
    mutationFn: ({
      kind,
      columns,
      format,
    }: {
      kind: ExportKind;
      columns: string[];
      format?: ExportJsonFormat;
    }) => api.exportBlob(kind, { columns, format }),
    onSuccess: (data) => {
      triggerDownload(data.blob, data.filename);
      setToast(`Export hotový: ${data.filename}`);
      setModalKind(null);
    },
  });

  function startExport(kind: ExportKind) {
    setModalKind(kind);
    exportMut.reset();
  }

  function onExportConfirm(columns: string[], jsonFormat: ExportJsonFormat) {
    if (!modalKind) return;
    exportMut.mutate({
      kind: modalKind,
      columns,
      format: modalKind === "json" ? jsonFormat : undefined,
    });
  }

  return (
    <div className="stack">
      <h1>Export inventára</h1>

      <p className="muted" style={{ marginTop: -4 }}>
        Aktuálny stav archívu — bez soft-deleted položiek. Pred stiahnutím
        vyber stĺpce; metadáta z JSONB sú samostatné polia. Súbor sa pomenuje
        s dnešným dátumom (YYYY-MM-DD).
      </p>

      {toast && (
        <div className="export-toast">
          ✓ {toast}
        </div>
      )}

      <section className="card">
        <h2>CSV (plochý)</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Pre Excel / Google Sheets. UTF-8 s BOM, oddelovač <code>;</code>,
          CRLF (SK locale). Hlavička riadkov je v slovenčine (napr. Stavba,
          Projektant). Každý kľúč z metadát má vlastný stĺpec.
        </p>
        <ExportTriggerButton
          kind="csv"
          label="Stiahnuť CSV…"
          subLabel="archiveapp-export-YYYY-MM-DD.csv"
          pending={exportMut.isPending && modalKind === "csv"}
          error={modalKind === "csv" ? (exportMut.error as Error | null) : null}
          onClick={() => startExport("csv")}
        />
      </section>

      <section className="card">
        <h2>JSON</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Hierarchický strom alebo plochý zoznam riadkov (rovnaké stĺpce ako
          CSV). Pole <code>photos[]</code> so storage key-mi len ak je vo
          výbere; bez signed URLs.
        </p>
        <ExportTriggerButton
          kind="json"
          label="Stiahnuť JSON…"
          subLabel="archiveapp-export-YYYY-MM-DD.json"
          pending={exportMut.isPending && modalKind === "json"}
          error={modalKind === "json" ? (exportMut.error as Error | null) : null}
          onClick={() => startExport("json")}
        />
      </section>

      {modalKind && (
        <ExportColumnsModal
          open
          kind={modalKind}
          onClose={() => {
            if (!exportMut.isPending) setModalKind(null);
          }}
          onConfirm={onExportConfirm}
        />
      )}
    </div>
  );
}

function ExportTriggerButton({
  kind,
  label,
  subLabel,
  pending,
  error,
  onClick,
}: {
  kind: ExportKind;
  label: string;
  subLabel: string;
  pending: boolean;
  error: Error | null;
  onClick: () => void;
}) {
  return (
    <>
      <button
        type="button"
        className="btn-primary export-button"
        onClick={onClick}
        disabled={pending}
        aria-label={label}
        data-export-kind={kind}
      >
        {pending ? (
          <>
            <span>Sťahujem…</span>
            <span className="export-button-sub">
              Môže to chvíľu trvať pri veľkom inventári
            </span>
          </>
        ) : (
          <>
            <span>↓ {label}</span>
            <span className="export-button-sub">{subLabel}</span>
          </>
        )}
      </button>
      {error && (
        <p className="error" style={{ marginTop: 8 }}>
          Chyba: {error.message}
        </p>
      )}
    </>
  );
}
