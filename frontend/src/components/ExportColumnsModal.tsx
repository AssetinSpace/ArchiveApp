import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  api,
  type ExportColumnDef,
  type ExportJsonFormat,
  type ExportKind,
} from "../api";
import {
  ColumnPickerModal,
  type ColumnPickerEntry,
  type ColumnPickerGroupDef,
} from "./ColumnPickerModal";
import {
  defaultItemsTableColumnOrder,
} from "../lib/itemsTableColumnPrefs";
import {
  exportColumnsFromTablePrefs,
  loadExportColumnPrefs,
  resolveInitialExportSelection,
  saveExportColumnPrefs,
} from "../lib/exportColumnPrefs";

const EXPORT_GROUPS: ColumnPickerGroupDef[] = [
  { id: "item", title: "Položka" },
  { id: "metadata", title: "Metadáta" },
  { id: "photos", title: "Fotky / OCR" },
  { id: "technical", title: "Technické" },
];

type Props = {
  open: boolean;
  kind: ExportKind;
  onClose: () => void;
  onConfirm: (columns: string[], jsonFormat: ExportJsonFormat) => void;
};

function catalogToEntries(columns: ExportColumnDef[]): ColumnPickerEntry[] {
  return columns.map((c) => ({
    id: c.id,
    label: c.label,
    group: c.group,
  }));
}

export function ExportColumnsModal({ open, kind, onClose, onConfirm }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["export-columns"],
    queryFn: () => api.exportColumns(),
    enabled: open,
  });

  const catalogIds = useMemo(
    () => (data?.columns ?? []).map((c) => c.id),
    [data?.columns],
  );

  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [jsonFormat, setJsonFormat] = useState<ExportJsonFormat>(() => {
    return loadExportColumnPrefs()?.jsonFormat ?? "tree";
  });

  useEffect(() => {
    if (!open || catalogIds.length === 0) return;
    const initial = resolveInitialExportSelection(catalogIds);
    setVisibleIds(new Set(initial));
    setJsonFormat(loadExportColumnPrefs()?.jsonFormat ?? "tree");
  }, [open, catalogIds.join(",")]);

  const entries = useMemo(
    () => catalogToEntries(data?.columns ?? []),
    [data?.columns],
  );

  function handleSyncFromTable() {
    const tableIds = defaultItemsTableColumnOrder(data?.metadataKeys ?? []);
    const synced = exportColumnsFromTablePrefs(catalogIds, tableIds);
    if (synced.length > 0) setVisibleIds(new Set(synced));
  }

  function handleApply(selected: Set<string>) {
    const columns = catalogIds.filter((id) => selected.has(id));
    saveExportColumnPrefs({
      selected: columns,
      jsonFormat,
    });
    onConfirm(columns, jsonFormat);
  }

  if (!open) return null;

  if (isLoading) {
    return (
      <ColumnPickerModal
        open
        title="Stĺpce exportu"
        subtitle="Načítavam katalóg stĺpcov…"
        entries={[]}
        groups={EXPORT_GROUPS}
        visibleIds={new Set()}
        onClose={onClose}
        onApply={() => {}}
        applyLabel="Stiahnuť"
      />
    );
  }

  if (error) {
    return (
      <ColumnPickerModal
        open
        title="Stĺpce exportu"
        subtitle={`Chyba: ${(error as Error).message}`}
        entries={[]}
        groups={EXPORT_GROUPS}
        visibleIds={new Set()}
        onClose={onClose}
        onApply={() => {}}
        applyLabel="Stiahnuť"
      />
    );
  }

  const jsonToolbar =
    kind === "json" ? (
      <fieldset className="export-format-fieldset form-label">
        <legend>Formát JSON</legend>
        <label className="items-table-check">
          <input
            type="radio"
            name="export-json-format"
            checked={jsonFormat === "tree"}
            onChange={() => setJsonFormat("tree")}
          />
          <span>Hierarchický strom</span>
        </label>
        <label className="items-table-check">
          <input
            type="radio"
            name="export-json-format"
            checked={jsonFormat === "flat"}
            onChange={() => setJsonFormat("flat")}
          />
          <span>Plochý zoznam (ako CSV)</span>
        </label>
      </fieldset>
    ) : null;

  return (
    <ColumnPickerModal
      open={open}
      title="Stĺpce exportu"
      subtitle="Vyber polia, ktoré sa majú objaviť v súbore. Metadáta z JSONB sú samostatné stĺpce. Nastavenie sa uloží v tomto prehliadači."
      titleId="export-columns-modal-title"
      entries={entries}
      groups={EXPORT_GROUPS}
      visibleIds={visibleIds}
      onClose={onClose}
      onApply={handleApply}
      applyLabel={kind === "csv" ? "Stiahnuť CSV" : "Stiahnuť JSON"}
      extraToolbar={jsonToolbar}
      headerActions={
        <button type="button" className="btn-link" onClick={handleSyncFromTable}>
          Ako v tabuľke inventára
        </button>
      }
    />
  );
}
