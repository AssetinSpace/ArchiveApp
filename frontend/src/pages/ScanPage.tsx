import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import {
  api,
  CHILD_TYPE_BY_PARENT,
  PARENT_TYPE_BY_CHILD,
  TYPE_LABEL,
  type Item,
  type ItemType,
  type QRLookup,
} from "../api";

type LookupState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "free"; lookup: QRLookup }
  | { kind: "not_found"; code: string }
  | { kind: "error"; message: string };

export function ScanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // ?parentId=... — používateľ prišiel z ItemDetailPage "Skenovať QR" linku.
  // Po naskenovaní FREE QR sa CreateForLookupForm predvyplní týmto rodičom
  // a odvodeným typom dieťaťa (napr. KRABICA → ZLOZKA).
  const presetParentId = searchParams.get("parentId") || null;

  const presetParentQ = useQuery({
    queryKey: ["items", "one", presetParentId],
    queryFn: () => api.getItem(presetParentId as string),
    enabled: !!presetParentId,
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
        // Priamy presmerujem na detail položky.
        navigate(`/items/${lookup.assignedItem.id}`);
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

      {/* Banner ak prichádzame z ItemDetailPage "Skenovať QR" */}
      {presetParentId && (
        <div className="card" style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}>
          <p style={{ margin: 0 }}>
            <strong>Pridávaš dieťa pre:</strong>{" "}
            {presetParentQ.isLoading && <span className="muted">načítavam…</span>}
            {presetParentQ.data && (
              <Link to={`/items/${presetParentId}`}>
                {presetParentQ.data.name ?? "(bez názvu)"} (
                {TYPE_LABEL[presetParentQ.data.type_code] ??
                  presetParentQ.data.type_code}
                )
              </Link>
            )}
            {presetParentQ.error && (
              <span className="error">
                {" "}
                — rodič sa nenašiel: {(presetParentQ.error as Error).message}
              </span>
            )}
          </p>
          <p className="muted" style={{ margin: "8px 0 0" }}>
            Po naskenovaní voľného QR sa typ a rodič automaticky predvyplnia.
          </p>
        </div>
      )}

      {/* Manuálny input — vždy viditeľný */}
      <section className="card">
        <h2>Zadať kód</h2>
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
            className="btn-primary"
            disabled={state.kind === "loading" || !code.trim()}
          >
            {state.kind === "loading" ? "Hľadám…" : "Hľadať"}
          </button>
        </form>
      </section>

      {/* Kamera */}
      <section className="card">
        <h2>Kamera</h2>
        {!cameraOn && (
          <>
            <p className="muted">
              Kamera sa spustí až po stlačení tlačidla (iOS Safari požiadavka).
              Funguje len na HTTPS doméne, na http://localhost nie.
            </p>
            <button type="button" className="btn-primary" onClick={startCamera}>
              ▶ Spustiť kameru
            </button>
          </>
        )}
        {cameraOn && (
          <>
            <video ref={videoRef} className="scanner-video" playsInline muted />
            <button
              type="button"
              className="btn-danger"
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
      {state.kind === "free" && (
        <CreateForLookupForm
          lookup={state.lookup}
          presetParent={presetParentQ.data ?? null}
          onCreated={(item) => {
            // Ak prišiel s parentId, vráť ho na detail rodiča (najprirodzenejší flow).
            // Inak na detail novovytvorenej položky.
            navigate(presetParentId ? `/items/${presetParentId}` : `/items/${item.id}`);
          }}
        />
      )}
    </div>
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
  const typesQ = useQuery({ queryKey: ["item-types"], queryFn: () => api.itemTypes() });
  const itemsQ = useQuery({ queryKey: ["items", "all"], queryFn: () => api.listItems() });

  // Odvodený typ dieťaťa z preset rodiča (napr. KRABICA → ZLOZKA).
  // Memoizované aby neretriggerovalo useEffect každý render.
  const presetChildType = useMemo(
    () => (presetParent ? CHILD_TYPE_BY_PARENT[presetParent.type_code] ?? null : null),
    [presetParent],
  );

  const [typeCode, setTypeCode] = useState<string>(presetChildType ?? "");
  const [parentId, setParentId] = useState<string>(presetParent?.id ?? "");
  const [name, setName] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Predvyplnenie keď preset dorazí asynchrónne (po fetch parent itemu).
  useEffect(() => {
    if (presetChildType) setTypeCode(presetChildType);
    if (presetParent) setParentId(presetParent.id);
  }, [presetChildType, presetParent]);

  const types = typesQ.data ?? [];
  const items = itemsQ.data ?? [];

  const expectedParent = typeCode ? PARENT_TYPE_BY_CHILD[typeCode] ?? null : null;
  const parentNeeded = typeCode !== "" && typeCode !== "SKLAD";
  const eligibleParents = expectedParent
    ? items.filter((it) => it.type_code === expectedParent)
    : [];

  const mut = useMutation({
    mutationFn: () =>
      api.createItem({
        type_code: typeCode,
        name: name.trim() || null,
        parent_id: parentId || null,
        note: note.trim() || null,
        qr_code: lookup.code,
      }),
    onSuccess: async (item) => {
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
    if (!typeCode) {
      setError("Vyber typ položky");
      return;
    }
    if (parentNeeded && !parentId) {
      setError(
        `Pre typ ${TYPE_LABEL[typeCode] ?? typeCode} musíš vybrať rodiča (${
          TYPE_LABEL[expectedParent ?? ""] ?? expectedParent
        })`,
      );
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
        <label className="form-label">
          Typ
          <select
            value={typeCode}
            onChange={(e) => {
              setTypeCode(e.target.value);
              setParentId("");
            }}
            required
          >
            <option value="">— vyber typ —</option>
            {types.map((t: ItemType) => (
              <option key={t.code} value={t.code}>
                {t.label} ({t.code})
              </option>
            ))}
          </select>
        </label>

        <label className="form-label">
          Rodič
          {typeCode === "" && (
            <input value="" disabled placeholder="(vyber najprv typ)" />
          )}
          {typeCode === "SKLAD" && (
            <input value="(žiadny — sklad je koreň)" disabled />
          )}
          {typeCode !== "" && typeCode !== "SKLAD" && (
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              required
            >
              <option value="">
                — vyber {TYPE_LABEL[expectedParent ?? ""] ?? "rodiča"} —
              </option>
              {eligibleParents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name ?? "(bez názvu)"}
                </option>
              ))}
            </select>
          )}
        </label>

        <label className="form-label">
          Názov
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="(voliteľné)"
          />
        </label>

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
