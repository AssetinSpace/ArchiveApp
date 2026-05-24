import type { InventoryItem, MetadataStatus } from "../api";
import { TYPE_LABEL } from "../api";

/** Interný kľúč pre prázdne bunky vo value filtri (Excel „(Prázdne)“). */
export const COLUMN_FILTER_EMPTY = "__empty__";

const STATUS_LABEL: Record<string, string> = {
  NA_MIESTE: "Na mieste",
  VYNESENE: "Vynesené",
  NEZNAME: "Neznáme",
};

const NAME_SOURCE_LABEL: Record<string, string> = {
  GENERATED: "auto",
  OCR: "z OCR",
  MANUAL: "ručne",
};

const METADATA_STATUS_LABEL: Record<MetadataStatus, string> = {
  NONE: "—",
  EXTRACTED: "Návrh",
  REVIEWED: "Potvrd.",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sk-SK", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Hodnota pre filter / sort — normalizovaný reťazec (prázdne = ""). */
export function getCellFilterValue(item: InventoryItem, columnId: string): string {
  switch (columnId) {
    case "level":
      return String(item.level);
    case "kind":
      return item.kind ?? "";
    case "name":
      return (item.name ?? "").trim();
    case "name_source":
      return item.name_source ?? "";
    case "metadata_status":
      return item.metadata_status ?? "NONE";
    case "qr_code":
      return (item.qr_code ?? "").trim();
    case "status":
      return item.status ?? "";
    case "note":
      return (item.note ?? "").trim();
    case "children":
      return item._count.children > 0 ? "1+" : "0";
    case "photos":
      return item._count.photos > 0 ? "1+" : "0";
    case "created_at":
      return item.created_at;
    case "updated_at":
      return item.updated_at;
    default:
      if (columnId.startsWith("meta_")) {
        const metaKey = columnId.slice(5);
        const v = item.metadata?.[metaKey];
        if (v === null || v === undefined) return "";
        return typeof v === "string" ? v.trim() : String(v);
      }
      return "";
  }
}

/** Zobrazenie hodnoty v zozname filtra. */
export function formatCellFilterLabel(columnId: string, value: string): string {
  if (value === COLUMN_FILTER_EMPTY || value === "") return "(Prázdne)";
  switch (columnId) {
    case "kind":
      return TYPE_LABEL[value] ?? value;
    case "status":
      return STATUS_LABEL[value] ?? value;
    case "name_source":
      return NAME_SOURCE_LABEL[value] ?? value;
    case "metadata_status":
      return METADATA_STATUS_LABEL[value as MetadataStatus] ?? value;
    case "created_at":
    case "updated_at":
      try {
        return formatDate(value);
      } catch {
        return value;
      }
    case "children":
      return value === "0" ? "0" : `${value} (má podradené)`;
    case "photos":
      return value === "0" ? "Bez fotky" : "Má fotku";
    default:
      return value;
  }
}

const NON_FILTERABLE = new Set(["expand", "delete"]);

export function isColumnFilterable(columnId: string): boolean {
  return !NON_FILTERABLE.has(columnId);
}

/** Porovnanie dvoch položiek pre triedenie súrodencov v strome. */
export function compareItemsForSort(
  a: InventoryItem,
  b: InventoryItem,
  columnId: string,
): number {
  const va = getCellFilterValue(a, columnId);
  const vb = getCellFilterValue(b, columnId);

  if (columnId === "level") {
    return (parseInt(va, 10) || 0) - (parseInt(vb, 10) || 0);
  }

  if (columnId === "children" || columnId === "photos") {
    const na = va === "0" ? 0 : 1;
    const nb = vb === "0" ? 0 : 1;
    return na - nb;
  }

  if (columnId === "created_at" || columnId === "updated_at") {
    const ta = Date.parse(va) || 0;
    const tb = Date.parse(vb) || 0;
    return ta - tb;
  }

  const emptyA = !va;
  const emptyB = !vb;
  if (emptyA && emptyB) return 0;
  if (emptyA) return 1;
  if (emptyB) return -1;

  return va.localeCompare(vb, "sk", { sensitivity: "base", numeric: true });
}
