/** Kontext rýchleho vytvárania položiek (sessionStorage — platí do zatvorenia karty). */

export type PlacementMode = "root" | "existing" | "lastCreated" | "lastParent";

type StoredCtx = {
  lastCreatedId: string | null;
  lastParentId: string | null;
  lastPlacementMode: PlacementMode;
};

const STORAGE_KEY = "archiveapp_create_item_ctx";

const DEFAULT: StoredCtx = {
  lastCreatedId: null,
  lastParentId: null,
  lastPlacementMode: "existing",
};

function read(): StoredCtx {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw) as Partial<StoredCtx>;
    return {
      lastCreatedId: parsed.lastCreatedId ?? null,
      lastParentId: parsed.lastParentId ?? null,
      lastPlacementMode: parsed.lastPlacementMode ?? "existing",
    };
  } catch {
    return { ...DEFAULT };
  }
}

function write(partial: Partial<StoredCtx>): void {
  const next = { ...read(), ...partial };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function getStoredPlacementMode(): PlacementMode {
  return read().lastPlacementMode;
}

export function setStoredPlacementMode(mode: PlacementMode): void {
  write({ lastPlacementMode: mode });
}

export function getLastCreatedId(): string | null {
  return read().lastCreatedId;
}

export function getLastParentId(): string | null {
  return read().lastParentId;
}

/** Po úspešnom vytvorení položky (kdekoľvek v aplikácii). */
export function recordItemCreated(item: { id: string; parent_id: string | null }): void {
  write({
    lastCreatedId: item.id,
    lastParentId: item.parent_id,
  });
}

/** Keď používateľ explicitne vyberie nadradenú položku v UI (dropdown). */
export function recordParentFocus(parentId: string | null): void {
  write({ lastParentId: parentId });
}

export function canBeParent(item: { level: number }): boolean {
  return item.level < 7;
}

type ItemRef = { id: string; parent_id: string | null; level: number };

/**
 * Rodič pre režim „pod poslednú nadradenú“:
 * prednostne rodič poslednej vytvorenej položky, inak posledný ručný výber.
 */
export function resolveLastParentId(byId: Map<string, ItemRef>): string | null {
  const createdId = getLastCreatedId();
  if (createdId) {
    const created = byId.get(createdId);
    if (created?.parent_id) {
      const parent = byId.get(created.parent_id);
      if (parent && canBeParent(parent)) return parent.id;
    }
  }
  const storedId = getLastParentId();
  if (!storedId) return null;
  const stored = byId.get(storedId);
  if (!stored || !canBeParent(stored)) return null;
  return storedId;
}
