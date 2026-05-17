import { Fragment } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, TYPE_LABEL, type BoxContents, type BoxFolder } from "../api";

// BoxContentsPage — Sprint 4.
//
// URL: /box/:qrCode  (typicky volaná zo ScanPage po naskenovaní KRABICA QR).
//
// Zobrazuje obsah krabice — všetky aktívne ZLOZKA descendants (rekurzívne, BE
// rieši cez WITH RECURSIVE). Každá zložka ako kartička s thumbnailom + name +
// QR + status badge + počet fotiek. Klik → /items/:id.

export function BoxContentsPage() {
  const { qrCode = "" } = useParams<{ qrCode: string }>();

  const boxQ = useQuery<BoxContents>({
    queryKey: ["box-contents", qrCode],
    queryFn: () => api.fetchBoxContents(qrCode),
    enabled: !!qrCode,
  });

  if (!qrCode) {
    return (
      <div className="stack">
        <h1>Obsah krabice</h1>
        <p className="error">Chýba QR kód v URL.</p>
      </div>
    );
  }

  return (
    <div className="stack">
      {boxQ.isLoading && (
        <>
          <h1>Obsah krabice</h1>
          <p className="muted">Načítavam…</p>
        </>
      )}

      {boxQ.error && (
        <>
          <h1>Obsah krabice</h1>
          <p className="error">Chyba: {(boxQ.error as Error).message}</p>
          <Link to="/scan" className="card-link">
            ← Späť na scan
          </Link>
        </>
      )}

      {boxQ.data && <BoxView data={boxQ.data} />}
    </div>
  );
}

function BoxView({ data }: { data: BoxContents }) {
  const { box, folders } = data;
  return (
    <>
      <div className="breadcrumb scrollable-x">
        {box.path.slice(0, -1).map((node, idx) => (
          <Fragment key={node.id}>
            {idx > 0 && <span className="breadcrumb-sep">›</span>}
            <Link to={`/items/${node.id}`}>
              {node.name ?? TYPE_LABEL[node.type_code] ?? node.type_code}
            </Link>
          </Fragment>
        ))}
      </div>

      <div className="row" style={{ gap: 8, flexWrap: "wrap", alignItems: "baseline" }}>
        <h1 style={{ margin: 0 }}>
          {box.name ?? "(bez názvu)"}
        </h1>
        <span className="badge badge-krabica">Krabica</span>
        {box.qrCode && (
          <span className="search-hit-qr">
            <code>{box.qrCode}</code>
          </span>
        )}
      </div>

      <Link to={`/items/${box.id}`} className="card-link">
        Otvoriť detail krabice →
      </Link>

      <h2>
        Zložky{" "}
        <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>
          ({folders.length})
        </span>
      </h2>

      {folders.length === 0 && (
        <div className="card">
          <p style={{ margin: 0 }}>Krabica je prázdna — žiadne zložky.</p>
        </div>
      )}

      {folders.length > 0 && (
        <div className="box-folders-grid">
          {folders.map((folder) => (
            <FolderCard key={folder.id} folder={folder} />
          ))}
        </div>
      )}
    </>
  );
}

function FolderCard({ folder }: { folder: BoxFolder }) {
  return (
    <Link to={`/items/${folder.id}`} className="box-folder-card">
      <div className="box-folder-thumb-wrap">
        {folder.photo ? (
          <img
            src={folder.photo.signedUrl}
            alt=""
            className="box-folder-thumb"
            loading="lazy"
          />
        ) : (
          <div className="box-folder-thumb-empty" aria-hidden="true">
            ⊟
          </div>
        )}
        {folder.photoCount > 1 && (
          <span className="box-folder-photo-count">{folder.photoCount} foto</span>
        )}
      </div>
      <div className="box-folder-meta">
        <span className="box-folder-name">{folder.name ?? "(bez názvu)"}</span>
        <div className="box-folder-bottom-row">
          {folder.qrCode ? (
            <span className="box-folder-qr">
              <code>{folder.qrCode}</code>
            </span>
          ) : (
            <span className="muted" style={{ fontSize: 11 }}>
              bez QR
            </span>
          )}
          <span className={`badge badge-${folder.status.toLowerCase()}`}>
            {folder.status}
          </span>
        </div>
      </div>
    </Link>
  );
}
