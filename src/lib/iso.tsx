import React from 'react';
import { ISO } from '../theme';

/**
 * 2:1 dimetricka projekcia ako na dlazdiciach webu (QuickStart.astro):
 * jednotka x posunie bod o (+1, +0.5), jednotka y o (-1, +0.5), z o (0, -1).
 * Vsetky rozmery su v jednotkach SVG user-space; skalovanie riesi rodic.
 */
export type P = [number, number];

export const iso = (x: number, y: number, z: number, ox = 0, oy = 0): P => [
  ox + (x - y),
  oy + (x + y) / 2 - z,
];

export const pts = (list: P[]) => list.map((p) => p.join(',')).join(' ');

/** Finder stvorce (lavy dolny, lavy horny, pravy horny) a pevne datove moduly v 9x9 mriezke. */
export const QR_GRID = 9; // 7 modulov + 1 modul tichej zony po okrajoch
export const QR_FINDERS: [number, number][] = [
  [1, 1],
  [1, 5],
  [5, 5],
];
export const QR_DATA: [number, number][] = [
  [5, 1],
  [7, 1],
  [6, 2],
  [5, 3],
  [7, 3],
  [1, 4],
  [2, 4],
  [4, 4],
  [4, 2],
  [4, 1],
  [2, 6],
  [3, 7],
  [7, 5],
  [6, 6],
  [7, 7],
  [5, 6],
  [4, 6],
  [6, 4],
  [3, 5],
  [1, 6],
];

export type Faces = { top?: string; left?: string; right?: string; edge?: string };

/**
 * Kvader so spodnym lavym-zadnym rohom (x,y,z) a rozmermi w (v smere x),
 * d (v smere y), h (vyska). Tri viditelne plochy: top, left (y = d), right (x = w).
 */
export const IsoBox: React.FC<{
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
  faces?: Faces;
  stroke?: boolean;
  opacity?: number;
}> = ({ x, y, z, w, d, h, faces, stroke, opacity }) => {
  const c = { top: ISO.top, left: ISO.left, right: ISO.right, edge: ISO.edge, ...faces };
  const A0 = iso(x, y, z),
    B0 = iso(x + w, y, z),
    C0 = iso(x + w, y + d, z),
    D0 = iso(x, y + d, z);
  const A1 = iso(x, y, z + h),
    B1 = iso(x + w, y, z + h),
    C1 = iso(x + w, y + d, z + h),
    D1 = iso(x, y + d, z + h);
  return (
    <g opacity={opacity}>
      <polygon points={pts([A1, B1, C1, D1])} fill={c.top} />
      <polygon points={pts([D1, C1, C0, D0])} fill={c.left} />
      <polygon points={pts([B1, C1, C0, B0])} fill={c.right} />
      {stroke ? (
        <polyline
          points={pts([D0, C0, B0])}
          fill="none"
          stroke={c.edge}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </g>
  );
};

/** Plocha podstavca (plinth) ako na dlazdiciach: tenka doska + hrana. */
export const Plinth: React.FC<{ x: number; y: number; z?: number; w: number; d: number }> = ({
  x,
  y,
  z = 0,
  w,
  d,
}) => <IsoBox x={x} y={y} z={z} w={w} d={d} h={10} faces={{ top: ISO.left, left: ISO.right, right: ISO.edge }} />;

/**
 * QR nalepka na lavej ploche (y = const) kvadra: stvorec so 5 modulmi,
 * rovnaka kresba ako na dlazdici. `s` = mierka 0..1 (pop), `t` = opacity.
 */
export const QrOnLeftFace: React.FC<{
  x: number;
  y: number;
  z: number;
  size: number;
  s?: number;
  opacity?: number;
}> = ({ x, y, z, size, s = 1, opacity = 1 }) => {
  const [cx, cy] = iso(x + size / 2, y, z + size / 2);
  const m = size / 9; // modul (9x9 mriezka: 3 finder + data)
  const sq = (mx: number, mz: number, k = 1) =>
    pts([
      iso(x + mx * m, y, z + mz * m),
      iso(x + (mx + k) * m, y, z + mz * m),
      iso(x + (mx + k) * m, y, z + (mz + k) * m),
      iso(x + mx * m, y, z + (mz + k) * m),
    ]);
  return (
    <g opacity={opacity} transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}>
      <polygon points={sq(0, 0, 9)} fill="#fff" stroke={ISO.edge} strokeWidth={0.8} />
      {QR_FINDERS.map(([fx, fz], i) => (
        <g key={i}>
          <polygon points={sq(fx, fz, 3)} fill={ISO.ink} />
          <polygon points={sq(fx + 0.6, fz + 0.6, 1.8)} fill="#fff" />
          <polygon points={sq(fx + 1, fz + 1, 1)} fill={ISO.ink} />
        </g>
      ))}
      {QR_DATA.map(([mx, mz], i) => (
        <polygon key={`d${i}`} points={sq(mx, mz)} fill={ISO.ink} />
      ))}
    </g>
  );
};

/** QR nalepka na pravej ploche (x = const). */
export const QrOnRightFace: React.FC<{
  x: number;
  y: number;
  z: number;
  size: number;
  s?: number;
  opacity?: number;
}> = ({ x, y, z, size, s = 1, opacity = 1 }) => {
  const [cx, cy] = iso(x, y + size / 2, z + size / 2);
  const m = size / 9;
  const sq = (my: number, mz: number, k = 1) =>
    pts([
      iso(x, y + my * m, z + mz * m),
      iso(x, y + (my + k) * m, z + mz * m),
      iso(x, y + (my + k) * m, z + (mz + k) * m),
      iso(x, y + my * m, z + (mz + k) * m),
    ]);
  return (
    <g opacity={opacity} transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}>
      <polygon points={sq(0, 0, 9)} fill="#fff" stroke={ISO.edge} strokeWidth={0.8} />
      {QR_FINDERS.map(([fx, fz], i) => (
        <g key={i}>
          <polygon points={sq(fx, fz, 3)} fill={ISO.ink} />
          <polygon points={sq(fx + 0.6, fz + 0.6, 1.8)} fill="#fff" />
          <polygon points={sq(fx + 1, fz + 1, 1)} fill={ISO.ink} />
        </g>
      ))}
      {QR_DATA.map(([my, mz], i) => (
        <polygon key={`d${i}`} points={sq(my, mz)} fill={ISO.ink} />
      ))}
    </g>
  );
};

/** Jednoducha krabica s vekom (zatvorena) - pre sklad. Hrana vlavo dole. */
export const Carton: React.FC<{ x: number; y: number; z: number; w?: number; d?: number; h?: number; qr?: number }> = ({
  x,
  y,
  z,
  w = 52,
  d = 36,
  h = 36,
  qr = 0,
}) => (
  <g>
    <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} stroke />
    {/* veko: tenka doska presahujuca o 2 */}
    <IsoBox x={x - 2} y={y - 2} z={z + h} w={w + 4} d={d + 4} h={4} stroke />
    {qr > 0 ? <QrOnLeftFace x={x + w * 0.28} y={y + d} z={z + h * 0.25} size={w * 0.46} s={qr} opacity={Math.min(1, qr * 1.5)} /> : null}
  </g>
);

/** Paleta: doska + tri nohy. */
export const Pallet: React.FC<{ x: number; y: number; z?: number; w?: number; d?: number }> = ({
  x,
  y,
  z = 0,
  w = 120,
  d = 80,
}) => (
  <g>
    {[0, 1, 2].map((i) => (
      <IsoBox key={i} x={x + (i * (w - 10)) / 2} y={y} z={z} w={10} d={d} h={8} faces={{ top: ISO.right, left: ISO.edge, right: ISO.edge }} />
    ))}
    <IsoBox x={x} y={y} z={z + 8} w={w} d={d} h={6} faces={{ top: ISO.left, left: ISO.right, right: ISO.edge }} />
  </g>
);

/** Regal: dve police so stlpikmi. Obsah sa kresli zvlast. */
export const ShelfFrame: React.FC<{ x: number; y: number; w: number; d: number; levels: number; levelH: number }> = ({
  x,
  y,
  w,
  d,
  levels,
  levelH,
}) => (
  <g>
    {Array.from({ length: levels + 1 }).map((_, i) => (
      <IsoBox key={`s${i}`} x={x} y={y} z={i * levelH} w={w} d={d} h={5} faces={{ top: ISO.left, left: ISO.right, right: ISO.edge }} />
    ))}
    {[
      [x, y],
      [x + w - 6, y],
      [x, y + d - 6],
      [x + w - 6, y + d - 6],
    ].map(([px, py], i) => (
      <IsoBox key={`p${i}`} x={px} y={py} z={0} w={6} d={6} h={levels * levelH + 5} faces={{ top: ISO.right, left: ISO.edge, right: ISO.ink }} />
    ))}
  </g>
);

/** Zlozka (A4 sanon) stojaca chrbtom dopredu-vlavo. */
export const Binder: React.FC<{ x: number; y: number; z: number; w?: number; d?: number; h?: number; lift?: number; qr?: number }> = ({
  x,
  y,
  z,
  w = 32,
  d = 8,
  h = 44,
  lift = 0,
  qr = 0,
}) => (
  <g transform={`translate(0 ${-lift})`}>
    <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} faces={{ top: ISO.top, left: '#f3f4f6', right: ISO.right }} stroke />
    <line
      {...(() => {
        const a = iso(x, y + d, z + h);
        const b = iso(x + w, y + d, z + h);
        return { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
      })()}
      stroke={ISO.edge}
      strokeWidth={2.2}
      strokeLinecap="round"
    />
    {qr > 0 ? <QrOnLeftFace x={x + w * 0.2} y={y + d} z={z + h * 0.45} size={w * 0.6} s={qr} opacity={Math.min(1, qr * 1.5)} /> : null}
  </g>
);

/** Stol s monitorom (cm). Predny lavy roh (x,y). */
export const Desk: React.FC<{ x: number; y: number; w?: number; d?: number; h?: number }> = ({ x, y, w = 160, d = 80, h = 75 }) => (
  <g>
    {[
      [x + 4, y + 4],
      [x + w - 10, y + 4],
      [x + 4, y + d - 10],
      [x + w - 10, y + d - 10],
    ].map(([px, py], i) => (
      <IsoBox key={i} x={px} y={py} z={0} w={6} d={6} h={h - 4} faces={{ top: ISO.right, left: ISO.edge, right: ISO.ink }} />
    ))}
    <IsoBox x={x} y={y} z={h - 4} w={w} d={d} h={4} faces={{ top: ISO.top, left: ISO.left, right: ISO.right }} stroke />
    {/* monitor: stojan + panel (tenky kvader) */}
    <IsoBox x={x + w * 0.55} y={y + 14} z={h} w={20} d={14} h={3} faces={{ top: ISO.right, left: ISO.edge, right: ISO.edge }} />
    <IsoBox x={x + w * 0.55 + 8} y={y + 20} z={h + 3} w={4} d={3} h={14} faces={{ top: ISO.edge, left: ISO.edge, right: ISO.ink }} />
    <IsoBox x={x + w * 0.55 - 12} y={y + 20} z={h + 16} w={46} d={2} h={30} faces={{ top: ISO.right, left: ISO.ink, right: ISO.edge }} />
  </g>
);

/** Kancelarska stolicka - zjednodusena. */
export const Chair: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    <IsoBox x={x + 18} y={y + 18} z={0} w={6} d={6} h={40} faces={{ top: ISO.edge, left: ISO.edge, right: ISO.ink }} />
    <IsoBox x={x} y={y} z={40} w={44} d={44} h={6} faces={{ top: ISO.right, left: ISO.edge, right: ISO.ink }} />
    <IsoBox x={x} y={y + 39} z={46} w={44} d={5} h={44} faces={{ top: ISO.right, left: ISO.edge, right: ISO.ink }} />
  </g>
);

/** Rolka pare (valec ako uzky kvader s kruhovymi celami) leziaca v smere x. */
export const Roll: React.FC<{ x: number; y: number; z: number; len?: number; dia?: number; opacity?: number }> = ({ x, y, z, len = 90, dia = 8, opacity = 1 }) => (
  <g opacity={opacity}>
    <IsoBox x={x} y={y} z={z} w={len} d={dia} h={dia} faces={{ top: '#fff', left: ISO.top, right: ISO.right }} stroke />
    {(() => {
      const c = iso(x + len, y + dia / 2, z + dia / 2);
      return <ellipse cx={c[0]} cy={c[1]} rx={dia * 0.55} ry={dia * 0.62} fill={ISO.right} stroke={ISO.edge} strokeWidth={0.8} />;
    })()}
  </g>
);

/**
 * Skrina s dvoma dverami a policami. `open` 0..1: lave dvere sa "sklopia"
 * k pantu (panel sa skaluje k lavej hrane a stmavne), prave dvere rovnako
 * k pravej hrane. Obsah polic sa kresli zvlast cez `children` (v iso
 * suradniciach vnutra), aby sa dal animovat.
 */
export const Cabinet: React.FC<{ x: number; y: number; w?: number; d?: number; h?: number; open?: number; children?: React.ReactNode }> = ({
  x,
  y,
  w = 100,
  d = 45,
  h = 200,
  open = 0,
  children,
}) => {
  const t = 3;
  const shelves = 3;
  const half = (w - 2 * t) / 2;
  // lave dvere: pant na lavej hrane (x+t, y+d); panel sa otaca z osi +x (zatvorene)
  // do osi +y (otvorene 90 stupnov dopredu). Vrcholy panelu sa interpoluju v iso svete.
  const ang = (open * Math.PI) / 2;
  const hx = x + t,
    hy = y + d;
  const far = { x: hx + Math.cos(ang) * half, y: hy + Math.sin(ang) * half };
  const p0 = iso(hx, hy, t),
    p1 = iso(far.x, far.y, t),
    p2 = iso(far.x, far.y, h - t),
    p3 = iso(hx, hy, h - t);
  const doorFill = open > 0.5 ? ISO.top : ISO.door;
  return (
    <g>
      {/* zadna stena, lava bocnica, police, obsah */}
      <IsoBox x={x} y={y} z={0} w={w} d={t} h={h} faces={{ top: ISO.left, left: ISO.left, right: ISO.right }} />
      <IsoBox x={x} y={y} z={0} w={t} d={d} h={h} faces={{ top: ISO.left, left: ISO.left, right: ISO.right }} />
      {Array.from({ length: shelves + 1 }).map((_, i) => (
        <IsoBox key={i} x={x + t} y={y + t} z={(i * (h - t)) / shelves} w={w - 2 * t} d={d - t} h={t} faces={{ top: ISO.left, left: ISO.right, right: ISO.edge }} />
      ))}
      {children}
      {/* prave kridlo (stale zatvorene) a prava bocnica - kreslia sa az po obsahu, aby nepresvital */}
      <IsoBox x={x + t + half + 1} y={y + d - t} z={t} w={half - 1} d={t} h={h - 2 * t} faces={{ top: ISO.door, left: ISO.door, right: ISO.left }} stroke />
      {(() => {
        const k = iso(x + t + half + 8, y + d, h / 2);
        return <circle cx={k[0]} cy={k[1]} r={1.8} fill={ISO.edge} />;
      })()}
      <IsoBox x={x + w - t} y={y} z={0} w={t} d={d} h={h} faces={{ top: ISO.left, left: ISO.left, right: ISO.right }} stroke />
      <IsoBox x={x} y={y} z={h - t} w={w} d={d} h={t} faces={{ top: ISO.top, left: ISO.left, right: ISO.right }} stroke />
      {/* lave dvere: otacaju sa okolo pantu */}
      <polygon points={pts([p0, p1, p2, p3])} fill={doorFill} stroke={ISO.edge} strokeWidth={1.4} strokeLinejoin="round" />
      {(() => {
        const k = iso(far.x - Math.cos(ang) * 8, far.y - Math.sin(ang) * 8, h / 2);
        return <circle cx={k[0]} cy={k[1]} r={1.8} fill={ISO.edge} />;
      })()}
    </g>
  );
};
