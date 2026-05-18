import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

type AutoNamePreviewProps = {
  typeCode: string;
  parentId: string;
  /** Ak používateľ píše vlastný názov, náhľad auto-name skryjeme. */
  manualName?: string;
};

/** Náhľad automaticky generovaného pozičného názvu (Sprint 5). */
export function AutoNamePreview({
  typeCode,
  parentId,
  manualName = "",
}: AutoNamePreviewProps) {
  const trimmedManual = manualName.trim();
  const enabled = !!typeCode && !!parentId && !trimmedManual;

  const previewQ = useQuery({
    queryKey: ["items", "auto-name-preview", typeCode, parentId],
    queryFn: () => api.previewAutoName({ type_code: typeCode, parent_id: parentId }),
    enabled,
    staleTime: 30_000,
  });

  if (trimmedManual) return null;

  if (!typeCode || !parentId) {
    return (
      <p className="auto-name-preview muted">
        Vyber typ a nadradenú položku — zobrazí sa náhľad automatického názvu.
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

  const autoName = previewQ.data?.auto_name;
  if (!autoName) return null;

  return (
    <div className="auto-name-preview" role="status" aria-live="polite">
      <span className="auto-name-preview-label">Automatický názov:</span>{" "}
      <code>{autoName}</code>
    </div>
  );
}
