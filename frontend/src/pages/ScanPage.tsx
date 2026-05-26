import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { AutoNamePreview } from "../components/AutoNamePreview";
import { recordItemCreated } from "../lib/createItemContext";
import {
  api,
  KIND_DEFAULTS,
  TYPE_LABEL,
  type Item,
  type QRLookup,
} from "../api";

type LookupState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "free"; lookup: QRLookup }
  | { kind: "assign_to"; lookup: QRLookup }
  | { kind: "assigned_box"; lookup: QRLookup }
  | { kind: "not_found"; code: string }
  | { kind: "error"; message: string };

export function ScanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // ?parentId=... — používateľ prišiel z ItemDetailPage "Skenovať QR" linku.
  // Po naskenovaní FREE QR sa CreateForLookupForm predvyplní týmto rodičom
  // a odvodeným typom dieťaťa (napr. KRABICA → ZLOZKA).
  const presetParentId = searchParams.get("parentId") || null;
  const assignToId = searchParams.get("assignTo") || null;

  const presetParentQ = useQuery({
    queryKey: ["items", "one", presetParentId],
    queryFn: () => api.getItem(presetParentId as string),
    enabled: !!presetParentId,
  });

  const assignToQ = useQuery({
    queryKey: ["items", "one", assignToId],
    queryFn: () => api.getItem(assignToId as string),
    enabled: !!assignToId,
  });

  const [code, setCode] = useState("");
  const [state, setState] = useState<LookupState>({ kind: "idle" });
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  function stopCamera() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setCameraOn(false);
  }

  async function lookupCode(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setState({ kind: "loading" });
    try {
      const lookup = await api.qrLookup(trimmed);
      if (lookup.status === "ASSIGNED" && lookup.assignedItem) {
        // Pre KRABICA ponúkneme chooser (detail vs obsah krabice). Pre ostatné
        // typy zachovávame pôvodné správanie — priamy redirect na detail.
        if (lookup.assignedItem.level === 4 || lookup.assignedItem.kind === "KRABICA") {
          setState({ kind: "assigned_box", lookup });
          return;
        }
        navigate(`/items/${lookup.assignedItem.id}`);
        return;
      }
      // Ak prichádzame z ItemDetailPage "Skenovať QR kód" (assignTo), ponúkni priame priradenie.
      if (assignToId && lookup.status === "FREE") {
        setState({ kind: "assign_to", lookup });
        return;
      }
      setState({ kind: "free", lookup });
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.toLowerCase().includes("not found")) {
        setState({ kind: "not_found", code: trimmed });
      } else {
        setState({ kind: "error", message: msg });
      }
    }
  }

  function startCamera() {
    setCameraError(null);
    setCameraOn(true);
    // Reálne spustenie zxing prebieha v useEffect nižšie — musíme počkať
    // na React render aby <video> element existoval a videoRef.current bol set.
    // Inak zxing dostane null, vytvorí interný skrytý video element,
    // QR scan funguje ale viditeľné <video> ostane čierne (Bug Sprint 2).
  }

  // Spustí zxing dekodér po tom čo React vyrenderuje <video> element.
  useEffect(() => {
    if (!cameraOn) return;

    let cancelled = false;
    const videoEl = videoRef.current;
    if (!videoEl) {
      // Nemalo by sa stať — keď cameraOn=true, video element je v JSX.
      setCameraOn(false);
      setCameraError("Video element nie je dostupný.");
      return;
    }

    (async () => {
      try {
        const reader = new BrowserQRCodeReader();
        // undefined deviceId → defaultná kamera (mobile zvyčajne back-facing).
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoEl,
          (result, _err, ctrls) => {
            if (result && !cancelled) {
              const text = result.getText();
              ctrls.stop();
              controlsRef.current = null;
              setCameraOn(false);
              setCode(text);
              void lookupCode(text);
            }
          },
        );
        if (cancelled) {
          controls.stop();
        } else {
          controlsRef.current = controls;
        }
      } catch (e) {
        if (cancelled) return;
        const msg = (e as Error).message;
        setCameraOn(false);
        // Typické chyby: NotAllowedError, NotFoundError, browser nepodporuje getUserMedia,
        // alebo HTTP (nie HTTPS) — kamera funguje len na HTTPS / localhost.
        setCameraError(
          `Kameru sa nepodarilo spustiť: ${msg}. ` +
            "Skontroluj povolenia kamery a že stránka beží na HTTPS (na http://localhost kamera nefunguje).",
        );
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [cameraOn]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void lookupCode(code);
  }

  return (
    <div className="stack">
      <h1>Scan QR kód</h1>

      {/* Banner: pridávaš podradeú položku (parentId) */}
      {presetParentId && (
        <div className="card" style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}>
          <p style={{ margin: 0 }}>
            <strong>Pridávaš podradeú položku pre:</strong>{" "}
            {presetParentQ.isLoading && <span className="muted">načítavam…</span>}
            {presetParentQ.data && (
              <Link to={`/items/${presetParentId}`}>
                {presetParentQ.data.name ?? "(bez názvu)"} (
                L{presetParentQ.data.level}{" "}
                {TYPE_LABEL[presetParentQ.data.kind] ?? presetParentQ.data.kind}
                )
              </Link>
            )}
            {presetParentQ.error && (
              <span className="error">
                {" "}
                — nadradená položka sa nenašla: {(presetParentQ.error as Error).message}
              </span>
            )}
          </p>
          <p className="muted" style={{ margin: "8px 0 0" }}>
            Po naskenovaní voľného QR sa typ a nadradená položka automaticky predvyplnia.
          </p>
        </div>
      )}

      {/* Banner: priradzuješ QR k existujúcej položke (assignTo) */}
      {assignToId && (
        <div className="card" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
          <p style={{ margin: 0 }}>
            <strong>Priradzuješ QR kód k položke:</strong>{" "}
            {assignToQ.isLoading && <span className="muted">načítavam…</span>}
            {assignToQ.data && (
              <Link to={`/items/${assignToId}`}>
                {assignToQ.data.name ?? "(bez názvu)"} (
                {TYPE_LABEL[assignToQ.data.kind] ?? assignToQ.data.kind})
              </Link>
            )}
            {assignToQ.error && (
              <span className="error">
                {" "}— položka sa nenašla: {(assignToQ.error as Error).message}
              </span>
            )}
          </p>
          <p className="muted" style={{ margin: "8px 0 0" }}>
            Naskenuj voľný QR kód — automaticky sa priradí k tejto položke.
          </p>
        </div>
      )}

      {/* Kamera — primárna akcia */}
      <section className="card">
        <h2>Kamera</h2>
        {!cameraOn && (
          <>
            <p className="muted" style={{ marginBottom: 12 }}>
              Kamera sa spustí až po stlačení tlačidla (iOS Safari požiadavka).
              Funguje len na HTTPS doméne, na http://localhost nie.
            </p>
            <button type="button" className="btn-primary btn-block" onClick={startCamera}
              style={{ minHeight: 52, fontSize: 18 }}>
              ▶ Spustiť kameru
            </button>
          </>
        )}
        {cameraOn && (
          <>
            <video ref={videoRef} className="scanner-video" playsInline muted />
            <button
              type="button"
              className="btn-danger btn-block"
              onClick={stopCamera}
              style={{ marginTop: 12 }}
            >
              ■ Zastaviť kameru
            </button>
          </>
        )}
        {cameraError && (
          <div className="error" style={{ marginTop: 8 }}>
            {cameraError}
          </div>
        )}
      </section>

      {/* Manuálny input */}
      <section className="card">
        <h2>Zadať kód ručne</h2>
        <form className="form" onSubmit={onSubmit}>
          <label className="form-label">
            QR kód
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="napr. QR-000001"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>
          <button
            type="submit"
            className="btn-primary btn-block"
            disabled={state.kind === "loading" || !code.trim()}
          >
            {state.kind === "loading" ? "Hľadám…" : "Hľadať"}
          </button>
        </form>
      </section>

      {/* Výsledok */}
      {state.kind === "error" && (
        <div className="card error">{state.message}</div>
      )}
      {state.kind === "not_found" && (
        <div className="card">
          <p className="error" style={{ margin: 0 }}>
            QR kód <strong>{state.code}</strong> nie je v systéme.
          </p>
          <p className="muted" style={{ margin: "8px 0 0" }}>
            Vygeneruj nové QR kódy v sekcii QR Admin alebo skontroluj že máš správny kód.
          </p>
        </div>
      )}
      {state.kind === "assigned_box" && state.lookup.assignedItem && (
        <section className="card">
          <h2>
            Krabica <code>{state.lookup.code}</code>
          </h2>
          <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <span className="badge badge-krabica">Krabica</span>
            <strong>{state.lookup.assignedItem.name ?? "(bez názvu)"}</strong>
          </div>
          <div className="scan-box-chooser">
            <Link
              to={`/items/${state.lookup.assignedItem.id}`}
              className="btn-primary btn-block"
              style={{
                minHeight: 52,
                fontSize: 17,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
              }}
            >
              Otvoriť detail
            </Link>
            <Link
              to={`/box/${encodeURIComponent(state.lookup.code)}`}
              className="btn-block"
              style={{
                minHeight: 52,
                fontSize: 17,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                background: "#fff",
                border: "1px solid #d1d5db",
                color: "#111827",
                borderRadius: 6,
              }}
            >
              Pozrieť obsah
            </Link>
          </div>
        </section>
      )}
      {state.kind === "assign_to" && assignToId && (
        <AssignToItemSection
          lookup={state.lookup}
          assignToItem={assignToQ.data ?? null}
          onAssigned={() => navigate(`/items/${assignToId}?tab=qr`)}
        />
      )}
      {state.kind === "free" && !assignToId && (
        <CreateForLookupForm
          lookup={state.lookup}
          presetParent={presetParentQ.data ?? null}
          onCreated={(item) => {
            navigate(presetParentId ? `/items/${presetParentId}` : `/items/${item.id}`);
          }}
        />
      )}
    </div>
  );
}

// ─── Priradenie FREE QR k existujúcej položke (assignTo flow) ─────────────────

function AssignToItemSection({
  lookup,
  assignToItem,
  onAssigned,
}: {
  lookup: QRLookup;
  assignToItem: Item | null;
  onAssigned: () => void;
}) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () =>
      assignToItem
        ? api.qrAssign(lookup.code, assignToItem.id)
        : Promise.reject(new Error("Položka nenájdená")),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["items"] }),
        qc.invalidateQueries({ queryKey: ["qr"] }),
      ]);
      onAssigned();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <section className="card">
      <h2>
        Priradiť QR <code>{lookup.code}</code>
      </h2>
      <p className="muted" style={{ margin: "0 0 12px" }}>
        QR kód je voľný (FREE). Priradí sa k tejto položke.
      </p>
      {assignToItem && (
        <div className="row" style={{ marginBottom: 16, gap: 8, flexWrap: "wrap" }}>
          <span className={`badge badge-${assignToItem.kind.toLowerCase()}`}>
            L{assignToItem.level} {TYPE_LABEL[assignToItem.kind] ?? assignToItem.kind}
          </span>
          <strong>{assignToItem.name ?? "(bez názvu)"}</strong>
        </div>
      )}
      {error && <div className="error" style={{ marginBottom: 8 }}>{error}</div>}
      <button
        type="button"
        className="btn-primary btn-block"
        disabled={mut.isPending || !assignToItem}
        onClick={() => mut.mutate()}
        style={{ minHeight: 52, fontSize: 17 }}
      >
        {mut.isPending ? "Priradzujem…" : `Priradiť ${lookup.code}`}
      </button>
    </section>
  );
}

// ─── Form pre vytvorenie novej položky priradenej k FREE QR ───────────────────

function CreateForLookupForm({
  lookup,
  presetParent,
  onCreated,
}: {
  lookup: QRLookup;
  presetParent: Item | null;
  onCreated: (item: Item) => void;
}) {
  const qc = useQueryClient();
  const itemsQ = useQuery({ queryKey: ["items", "all"], queryFn: () => api.listItems() });

  const isRoot = !presetParent;
  const [parentId, setParentId] = useState(presetParent?.id ?? "");
  const childLevel = presetParent ? presetParent.level + 1 : isRoot ? 1 : 0;
  const defaults = KIND_DEFAULTS[childLevel] ?? [];
  const [kindInput, setKindInput] = useState(defaults[0] ?? "");
  const [customKind, setCustomKind] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (presetParent) setParentId(presetParent.id);
    const level = presetParent ? presetParent.level + 1 : 1;
    const defs = KIND_DEFAULTS[level] ?? [];
    if (defs[0]) setKindInput(defs[0]);
  }, [presetParent]);

  const items = itemsQ.data ?? [];
  const byId = useMemo(() => new Map(items.map((it) => [it.id, it])), [items]);
  const parent = parentId ? byId.get(parentId) : undefined;
  const level = presetParent ? presetParent.level + 1 : parent ? parent.level + 1 : 1;
  const eligibleParents = items.filter((it) => it.level < 7);

  const mut = useMutation({
    mutationFn: () => {
      const kind = kindInput.trim();
      if (!kind) throw new Error("Vyber alebo napíš typ položky");
      return api.createItem({
        level,
        kind,
        name: name.trim() || null,
        parent_id: presetParent ? presetParent.id : parentId || null,
        note: note.trim() || null,
        qr_code: lookup.code,
      });
    },
    onSuccess: async (item) => {
      recordItemCreated(item);
      // Await invalidácie aby refetch dorazil pred navigáciou späť na rodiča
      // (Bug 3 fix — rovnaký pattern ako v ItemDetailPage).
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["items"] }),
        qc.invalidateQueries({ queryKey: ["qr"] }),
      ]);
      onCreated(item);
    },
    onError: (e: Error) => setError(e.message),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!kindInput.trim()) {
      setError("Vyber alebo napíš typ položky");
      return;
    }
    if (!presetParent && level > 1 && !parentId) {
      setError("Vyber nadradenú položku");
      return;
    }
    mut.mutate();
  }

  return (
    <section className="card">
      <h2>
        Priradiť QR <code>{lookup.code}</code> k novej položke
      </h2>
      <p className="muted" style={{ margin: "0 0 12px" }}>
        QR kód je voľný (FREE). Vytvor novú položku — QR sa automaticky priradí.
      </p>
      <form className="form" onSubmit={onSubmit}>
        {presetParent ? (
          <p className="muted" style={{ margin: 0 }}>
            Rodič: <strong>{presetParent.name}</strong> (L{presetParent.level})
          </p>
        ) : (
          <label className="form-label">
            Nadradená položka (voliteľné pre L1)
            <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">— koreň L1 —</option>
              {eligibleParents.map((p) => (
                <option key={p.id} value={p.id}>
                  L{p.level} {TYPE_LABEL[p.kind] ?? p.kind} — {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <p className="muted" style={{ margin: "0 0 8px" }}>
          Úroveň: <strong>{level}</strong>
        </p>
        <label className="form-label">
          Typ položky
          <select
            value={customKind ? "__custom__" : kindInput}
            onChange={(e) => {
              if (e.target.value === "__custom__") {
                setCustomKind(true);
                setKindInput("");
              } else {
                setCustomKind(false);
                setKindInput(e.target.value);
              }
            }}
          >
            {defaults.map((k) => (
              <option key={k} value={k}>
                {TYPE_LABEL[k] ?? k}
              </option>
            ))}
            <option value="__custom__">Vlastné…</option>
          </select>
        </label>
        {customKind && (
          <label className="form-label">
            Vlastný typ
            <input
              type="text"
              value={kindInput}
              onChange={(e) => setKindInput(e.target.value)}
              autoFocus
            />
          </label>
        )}

        <label className="form-label">
          Názov
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="(voliteľné — inak sa vygeneruje automaticky)"
          />
        </label>
        <AutoNamePreview
          kind={kindInput}
          parentId={presetParent ? presetParent.id : parentId || null}
          manualName={name}
        />

        <label className="form-label">
          Poznámka
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="(voliteľné)"
          />
        </label>

        {error && <div className="error">{error}</div>}

        <button type="submit" className="btn-primary" disabled={mut.isPending}>
          {mut.isPending ? "Vytváram…" : "Vytvoriť a priradiť"}
        </button>
      </form>
    </section>
  );
}
