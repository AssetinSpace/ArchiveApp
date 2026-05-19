import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

type NamePreviewProps = {
  kind: string;
  parentId: string | null;
  /** Ak používateľ píše vlastný názov, náhľad skryjeme. */
  manualName?: string;
};

/** Náhľad automaticky generovaného názvu (Sprint 8). */
export function AutoNamePreview({
  kind,
  parentId,
  manualName = "",
}: NamePreviewProps) {
  const trimmedManual = manualName.trim();
  const enabled = !!kind.trim() && !trimmedManual;

  const previewQ = useQuery({
    queryKey: ["items", "name-preview", kind, parentId],
    queryFn: () => api.previewName({ kind, parent_id: parentId }),
    enabled,
    staleTime: 30_000,
  });

  if (trimmedManual) return null;

  if (!kind.trim()) {
    return (
      <p className="auto-name-preview muted">
        Vyber typ položky — zobrazí sa náhľad automatického názvu.
      </p>
    );
  }

  if (previewQ.isLoading) {
    return <p className="auto-name-preview muted">Počítam náhľad názvu…</p>;
  }

  if (previewQ.error) {
    return (
      <p className="auto-name-preview error" style={{ fontSize: 14 }}>
        {(previewQ.error as Error).message}
      </p>
    );
  }

  const name = previewQ.data?.name;
  if (!name) return null;

  return (
    <div className="auto-name-preview" role="status" aria-live="polite">
      <span className="auto-name-preview-label">Automatický názov:</span>{" "}
      <code>{name}</code>
    </div>
  );
}
