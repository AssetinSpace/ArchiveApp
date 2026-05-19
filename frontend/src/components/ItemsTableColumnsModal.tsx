import {
  ColumnPickerModal,
  type ColumnPickerEntry,
  type ColumnPickerGroupDef,
} from "./ColumnPickerModal";

export type { ColumnPickerEntry };

const TABLE_GROUPS: ColumnPickerGroupDef[] = [
  { id: "base", title: "Položka" },
  { id: "metadata", title: "Metadáta" },
];

type Props = {
  open: boolean;
  entries: ColumnPickerEntry[];
  visibleIds: Set<string>;
  onClose: () => void;
  onApply: (visibleIds: Set<string>) => void;
  portalTarget?: HTMLElement | null;
};

export function ItemsTableColumnsModal({
  open,
  entries,
  visibleIds,
  onClose,
  onApply,
  portalTarget,
}: Props) {
  return (
    <ColumnPickerModal
      open={open}
      title="Stĺpce tabuľky"
      subtitle="Vyber, čo chceš vidieť v inventári. Poradie a šírku stĺpcov upravíš priamo v hlavičke tabuľky — presuň názov stĺpca alebo ťahaj okraj vpravo. Nastavenie sa uloží v tomto prehliadači."
      titleId="items-columns-modal-title"
      entries={entries}
      groups={TABLE_GROUPS}
      visibleIds={visibleIds}
      onClose={onClose}
      onApply={onApply}
      portalTarget={portalTarget}
    />
  );
}
