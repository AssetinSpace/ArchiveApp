import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  loadItemsTableColumnPrefs,
  migrateColumnPrefsFromUrl,
  registerMetadataColumnKeys,
  saveItemsTableColumnPrefs,
  type ItemsTableColumnPrefs,
} from "../lib/itemsTableColumnPrefs";
import type { InventoryItem } from "../api";
import { metadataTableColumnKeys } from "../lib/metadataDraft";

const HIDDEN_COLS_KEY = "hide";
const SHOWN_COLS_KEY = "show";

function setsFromPrefs(prefs: ItemsTableColumnPrefs) {
  return {
    hiddenColumns: new Set(prefs.hidden),
    shownColumns: new Set(prefs.shown),
    metadataRegistry: prefs.metadataKeys,
  };
}

export function useItemsTableColumnPrefs(
  allItems: InventoryItem[],
) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [prefs, setPrefs] = useState<ItemsTableColumnPrefs>(() => {
    const hiddenFromUrl = new Set(
      (searchParams.get(HIDDEN_COLS_KEY) ?? "").split(",").filter(Boolean),
    );
    const shownFromUrl = new Set(
      (searchParams.get(SHOWN_COLS_KEY) ?? "").split(",").filter(Boolean),
    );
    if (hiddenFromUrl.size > 0 || shownFromUrl.size > 0) {
      return migrateColumnPrefsFromUrl(hiddenFromUrl, shownFromUrl);
    }
    return loadItemsTableColumnPrefs();
  });

  const { hiddenColumns, shownColumns, metadataRegistry } = useMemo(
    () => setsFromPrefs(prefs),
    [prefs],
  );

  // Jednorazovo vyčisti legacy URL parametre po migrácii.
  useEffect(() => {
    if (
      !searchParams.has(HIDDEN_COLS_KEY) &&
      !searchParams.has(SHOWN_COLS_KEY)
    ) {
      return;
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(HIDDEN_COLS_KEY);
        next.delete(SHOWN_COLS_KEY);
        return next;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams]);

  // Z inventára doplníme registr — aby sa v ponuke objavili všetky kľúče z dát.
  useEffect(() => {
    if (allItems.length === 0) return;
    const fromItems = metadataTableColumnKeys(allItems);
    setPrefs((prev) => {
      const current = new Set(prev.metadataKeys);
      let changed = false;
      for (const k of fromItems) {
        if (!current.has(k)) {
          current.add(k);
          changed = true;
        }
      }
      if (!changed) return prev;
      const next: ItemsTableColumnPrefs = {
        ...prev,
        metadataKeys: [...current].sort((a, b) => a.localeCompare(b, "sk")),
      };
      saveItemsTableColumnPrefs(next);
      return next;
    });
  }, [allItems]);

  const metadataColumnKeys = useMemo(
    () => metadataTableColumnKeys(allItems, metadataRegistry),
    [allItems, metadataRegistry],
  );

  const applyColumnVisibility = useCallback(
    (visibleIds: Set<string>, allToggleableIds: string[]) => {
      const visible = new Set(visibleIds);
      const hidden = allToggleableIds.filter((id) => !visible.has(id));
      const defaultHidden = new Set([
        "updated_at",
        "name_source",
        "metadata_status",
      ]);
      const shown = [...visible].filter(
        (id) => defaultHidden.has(id) || id.startsWith("meta_"),
      );
      const next: ItemsTableColumnPrefs = {
        ...prefs,
        hidden,
        shown,
      };
      saveItemsTableColumnPrefs(next);
      setPrefs(next);
    },
    [prefs],
  );

  const setHiddenColumns = useCallback(
    (cols: Set<string>) => {
      const next = { ...prefs, hidden: [...cols] };
      saveItemsTableColumnPrefs(next);
      setPrefs(next);
    },
    [prefs],
  );

  const setShownColumns = useCallback(
    (cols: Set<string>) => {
      const next = { ...prefs, shown: [...cols] };
      saveItemsTableColumnPrefs(next);
      setPrefs(next);
    },
    [prefs],
  );

  return {
    hiddenColumns,
    shownColumns,
    metadataColumnKeys,
    metadataRegistry,
    applyColumnVisibility,
    setHiddenColumns,
    setShownColumns,
    registerMetadataKeys: registerMetadataColumnKeys,
  };
}
