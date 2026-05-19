import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, type ExportKind } from "../api";

// ExportPage — Sprint 4.
//
// Dve veľké tlačidlá: Stiahnuť CSV / JSON. Po kliku zavolá api.exportBlob,
// vyvolá download cez dočasný <a download>. Basic Auth musí ísť cez fetch header
// (window.open / <a href> ho nepošle) — pattern rovnaký ako qrPrintBlob.

const TOAST_MS = 3000;

export function ExportPage() {
  const [toast, setToast] = useState<string | null>(null);

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
    // Trošku odložiť revoke — niektoré prehliadače inak download zrušia.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const csvMut = useMutation({
    mutationFn: () => api.exportBlob("csv"),
    onSuccess: (data) => {
      triggerDownload(data.blob, data.filename);
      setToast(`Export hotový: ${data.filename}`);
    },
  });

  const jsonMut = useMutation({
    mutationFn: () => api.exportBlob("json"),
    onSuccess: (data) => {
      triggerDownload(data.blob, data.filename);
      setToast(`Export hotový: ${data.filename}`);
    },
  });

  return (
    <div className="stack">
      <h1>Export inventára</h1>

      <p className="muted" style={{ marginTop: -4 }}>
        Aktuálny stav archívu — bez soft-deleted položiek. Súbor sa pomenuje
        s dnešným dátumom (YYYY-MM-DD).
      </p>

      {toast && <div className="export-toast">✓ {toast}</div>}

      <section className="card">
        <h2>CSV (plochý)</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Pre Excel / Google Sheets. UTF-8 s BOM, oddelovač <code>;</code>,
          CRLF (SK locale). Stĺpce: <code>id, qrCode, name, level, kind,
          nameSource, metadataStatus, metadataJson, metaStavba…metaStupen, note, status,
          path, photoCount, hasOcrText, ocrTextPreview, createdAt, updatedAt</code>.
          Cesta je v tvare <code>Sklad A &gt; Paleta 7 &gt; Krabica 23 &gt;
          Zložka X</code>.
        </p>
        <ExportButton
          kind="csv"
          label="Stiahnuť CSV"
          subLabel="archiveapp-export-YYYY-MM-DD.csv"
          pending={csvMut.isPending}
          error={csvMut.error as Error | null}
          onClick={() => csvMut.mutate()}
        />
      </section>

      <section className="card">
        <h2>JSON (hierarchický)</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Strom SKLAD → PALETA → KRABICA → ZLOZKA s vnorenými{" "}
          <code>children[]</code>. Každá položka má pole{" "}
          <code>photos[]</code> so storage key-mi a OCR textami. Bez signed URLs
          (tie sú efemérne — fotky sa stiahnu z R2 bucket-u cez rclone).
        </p>
        <ExportButton
          kind="json"
          label="Stiahnuť JSON"
          subLabel="archiveapp-export-YYYY-MM-DD.json"
          pending={jsonMut.isPending}
          error={jsonMut.error as Error | null}
          onClick={() => jsonMut.mutate()}
        />
      </section>
    </div>
  );
}

function ExportButton({
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
            <span className="export-button-sub">Môže to chvíľu trvať pri veľkom inventári</span>
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
