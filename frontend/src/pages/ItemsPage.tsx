import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Item, type ItemType } from "../api";

// ─── constants ────────────────────────────────────────────────────────────────

const PARENT_TYPE_BY_CHILD: Record<string, string | null> = {
  SKLAD: null,
  PALETA: "SKLAD",
  KRABICA: "PALETA",
  ZLOZKA: "KRABICA",
};

const TYPE_LABEL: Record<string, string> = {
  SKLAD: "Sklad",
  PALETA: "Paleta",
  KRABICA: "Krabica",
  ZLOZKA: "Zložka",
};

const TYPE_COLOR: Record<string, { bg: string; text: string }> = {
  SKLAD:   { bg: "#f0fdf4", text: "#166534" },
  PALETA:  { bg: "#eff6ff", text: "#1d4ed8" },
  KRABICA: { bg: "#fefce8", text: "#854d0e" },
  ZLOZKA:  { bg: "#fdf4ff", text: "#7e22ce" },
};

// ─── tree node ────────────────────────────────────────────────────────────────

function TreeNode({ item, level }: { item: Item; level: number }) {
  const [expanded, setExpanded] = useState(false);
  const qc = useQueryClient();

  const childrenQ = useQuery({
    queryKey: ["items", "children", item.id],
    queryFn: () => api.getChildren(item.id),
    enabled: expanded,
    staleTime: 30_000,
  });

  const children = childrenQ.data ?? [];
  const isLoading = childrenQ.isFetching;
  // After first fetch we know if there are children; before that show toggle for non-leaf types.
  const mightHaveChildren = childrenQ.data === undefined || children.length > 0;
  const isEmpty = childrenQ.data !== undefined && children.length === 0;

  const colorScheme = TYPE_COLOR[item.type_code] ?? { bg: "#f9fafb", text: "#374151" };
  const indent = level * 28;

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!expanded && childrenQ.data === undefined) {
      // Will trigger fetch via `enabled`
    }
    setExpanded((v) => !v);
  }

  // After creating a child of this item, refresh its children list.
  void qc; // used in parent component's mutation

  return (
    <div>
      {/* Row */}
      <div
        onClick={toggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          paddingLeft: indent + 8,
          paddingRight: 12,
          paddingTop: 8,
          paddingBottom: 8,
          cursor: "pointer",
          borderRadius: 6,
          userSelect: "none",
          transition: "background 120ms",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.background = "#f3f4f6")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.background = "transparent")
        }
      >
        {/* Chevron */}
        <span
          style={{
            width: 18,
            fontSize: 10,
            color: mightHaveChildren ? "#6b7280" : "transparent",
            flexShrink: 0,
            transition: "transform 150ms",
            display: "inline-block",
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
          }}
        >
          ▶
        </span>

        {/* Type badge */}
        <span
          style={{
            background: colorScheme.bg,
            color: colorScheme.text,
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: 4,
            letterSpacing: 0.4,
            flexShrink: 0,
          }}
        >
          {TYPE_LABEL[item.type_code] ?? item.type_code}
        </span>

        {/* Name */}
        <span style={{ fontWeight: 500, fontSize: 14, color: "#111827", flexGrow: 1 }}>
          {item.name ?? <em style={{ color: "#9ca3af" }}>(bez názvu)</em>}
        </span>

        {/* Note snippet */}
        {item.note && (
          <span
            style={{
              fontSize: 12,
              color: "#6b7280",
              maxWidth: 300,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {item.note}
          </span>
        )}
      </div>

      {/* Children */}
      {expanded && (
        <div
          style={{
            borderLeft: "2px solid #e5e7eb",
            marginLeft: indent + 17,
          }}
        >
          {isLoading && (
            <div style={{ padding: "6px 12px", color: "#9ca3af", fontSize: 13 }}>
              Načítavam…
            </div>
          )}
          {children.map((child) => (
            <TreeNode key={child.id} item={child} level={level + 1} />
          ))}
          {isEmpty && (
            <div style={{ padding: "6px 12px", color: "#d1d5db", fontSize: 12 }}>
              Žiadne položky
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── tree root ────────────────────────────────────────────────────────────────

function TreeView() {
  const rootQ = useQuery({
    queryKey: ["items", "root"],
    queryFn: () => api.listItems({ parent_id: null }),
  });

  if (rootQ.isLoading) return <p style={{ color: "#9ca3af", fontSize: 13 }}>Načítavam…</p>;
  if (rootQ.error)
    return (
      <p style={{ color: "#b91c1c", fontSize: 13 }}>
        Chyba: {(rootQ.error as Error).message}
      </p>
    );
  const roots = rootQ.data ?? [];
  if (roots.length === 0)
    return <p style={{ color: "#9ca3af", fontSize: 13 }}>Žiadne položky</p>;

  return (
    <div>
      {roots.map((item) => (
        <TreeNode key={item.id} item={item} level={0} />
      ))}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export function ItemsPage() {
  const qc = useQueryClient();

  const typesQ = useQuery({ queryKey: ["item-types"], queryFn: () => api.itemTypes() });
  // Flat list used only for parent dropdowns in the form
  const itemsQ = useQuery({ queryKey: ["items", "all"], queryFn: () => api.listItems() });

  const [typeCode, setTypeCode] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [parentId, setParentId] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  const items = itemsQ.data ?? [];
  const types = typesQ.data ?? [];

  // Map for fast path traversal without extra API calls
  const byId = useMemo(() => new Map(items.map((it) => [it.id, it])), [items]);

  function getFullPath(item: Item): string {
    const parts: string[] = [];
    let cur: Item | undefined = item;
    const seen = new Set<string>();
    while (cur) {
      if (seen.has(cur.id)) break;
      seen.add(cur.id);
      parts.unshift(cur.name ?? "(bez názvu)");
      cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
    }
    return parts.join(" → ");
  }

  const expectedParentType = useMemo(
    () => (typeCode ? (PARENT_TYPE_BY_CHILD[typeCode] ?? null) : null),
    [typeCode],
  );
  const parentNeeded = typeCode !== "" && typeCode !== "SKLAD";
  const eligibleParents = useMemo(
    () => (expectedParentType ? items.filter((it) => it.type_code === expectedParentType) : []),
    [items, expectedParentType],
  );

  const createMut = useMutation({
    mutationFn: api.createItem,
    onSuccess: (created) => {
      // Invalidate flat list (for form dropdowns)
      qc.invalidateQueries({ queryKey: ["items", "all"] });
      // Invalidate tree: root if new item is a root, or parent's children
      if (!created.parent_id) {
        qc.invalidateQueries({ queryKey: ["items", "root"] });
      } else {
        qc.invalidateQueries({ queryKey: ["items", "children", created.parent_id] });
      }
      setName("");
      setParentId("");
      setNote("");
      setFormError(null);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!typeCode) { setFormError("Vyber typ položky"); return; }
    if (parentNeeded && !parentId) {
      setFormError(
        `Pre typ ${TYPE_LABEL[typeCode] ?? typeCode} musíš vybrať rodiča (${TYPE_LABEL[expectedParentType ?? ""] ?? expectedParentType})`,
      );
      return;
    }
    createMut.mutate({
      type_code: typeCode,
      name: name.trim() || null,
      parent_id: parentId || null,
      note: note.trim() || null,
    });
  }

  return (
    <>
      {/* ── Create form ── */}
      <section style={card}>
        <h2 style={h2}>Vytvoriť položku</h2>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <div style={row}>
            <label style={labelStyle}>Typ</label>
            <select
              value={typeCode}
              onChange={(e) => { setTypeCode(e.target.value); setParentId(""); }}
              style={inputStyle}
              required
            >
              <option value="">— vyber typ —</option>
              {types.map((t: ItemType) => (
                <option key={t.code} value={t.code}>
                  {t.label} ({t.code})
                </option>
              ))}
            </select>
          </div>

          <div style={row}>
            <label style={labelStyle}>Názov</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="napr. Krabica pri okne"
              style={inputStyle}
            />
          </div>

          <div style={row}>
            <label style={labelStyle}>Rodič</label>
            {typeCode === "" ? (
              <input style={inputStyle} value="" disabled placeholder="(vyber najprv typ)" />
            ) : typeCode === "SKLAD" ? (
              <input style={inputStyle} value="(žiadny — sklad je koreň stromu)" disabled />
            ) : (
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                style={inputStyle}
                required
              >
                <option value="">
                  — vyber {TYPE_LABEL[expectedParentType ?? ""] ?? "rodiča"} —
                </option>
                {eligibleParents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {getFullPath(p)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={row}>
            <label style={labelStyle}>Poznámka</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
              placeholder="(voliteľné)"
            />
          </div>

          {formError && <div style={{ color: "#b91c1c", fontSize: 13 }}>{formError}</div>}

          <div>
            <button type="submit" disabled={createMut.isPending} style={btnStyle}>
              {createMut.isPending ? "Ukladám…" : "Vytvoriť"}
            </button>
          </div>
        </form>
      </section>

      {/* ── Tree view ── */}
      <section style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <h2 style={{ ...h2, margin: 0 }}>Strom položiek</h2>
          <Legend />
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "#9ca3af" }}>
          Klikni na riadok pre rozbalenie / zbalenie potomkov.
        </p>
        <TreeView />
      </section>
    </>
  );
}

function Legend() {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {Object.entries(TYPE_LABEL).map(([code, label]) => {
        const c = TYPE_COLOR[code] ?? { bg: "#f9fafb", text: "#374151" };
        return (
          <span
            key={code}
            style={{
              background: c.bg,
              color: c.text,
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: 4,
              letterSpacing: 0.4,
            }}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 20,
  marginBottom: 20,
};
const h2: React.CSSProperties = { margin: "0 0 16px", fontSize: 18 };
const row: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "120px 1fr",
  alignItems: "center",
  gap: 12,
};
const labelStyle: React.CSSProperties = { fontSize: 13, color: "#374151" };
const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 14,
  width: "100%",
  boxSizing: "border-box",
};
const btnStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 14,
  cursor: "pointer",
};
