import {
  KNOWN_METADATA_KEYS,
  METADATA_LABELS,
  type ItemMetadata,
} from "../api";

/** Všetky kľúče z metadata → draft pre inputy (prázdne = ""). */
export function normalizeMetadataDraft(
  metadata: ItemMetadata | undefined,
): ItemMetadata {
  const out: ItemMetadata = {};
  for (const [k, v] of Object.entries(metadata ?? {})) {
    if (typeof k !== "string" || !k.trim()) continue;
    out[k] =
      typeof v === "string" ? v : v === null || v === undefined ? "" : String(v);
  }
  return out;
}

/** Draft z formulára → uložiteľné metadata (prázdny string → null). */
export function serializeMetadataDraft(draft: ItemMetadata): ItemMetadata {
  const out: ItemMetadata = {};
  for (const [k, v] of Object.entries(draft)) {
    if (typeof k !== "string" || !k.trim()) continue;
    const trimmed = typeof v === "string" ? v.trim() : "";
    out[k] = trimmed !== "" ? trimmed : null;
  }
  return out;
}

export function metadataFieldLabel(key: string): string {
  return METADATA_LABELS[key] ?? key.replace(/_/g, " ");
}

/** Kľúče pre edit grid: suggested polia + ďalšie z draftu (bez duplicít). */
export function metadataEditKeys(draft: ItemMetadata): string[] {
  const knownSet = new Set<string>(KNOWN_METADATA_KEYS);
  const extra = Object.keys(draft)
    .filter((k) => !knownSet.has(k))
    .sort((a, b) => a.localeCompare(b, "sk"));
  return [...KNOWN_METADATA_KEYS, ...extra];
}
