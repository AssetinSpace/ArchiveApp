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
  const m = size / 7; // modul
  const sq = (mx: number, mz: number, k = 2) =>
    pts([
      iso(x + mx * m, y, z + mz * m),
      iso(x + (mx + k) * m, y, z + mz * m),
      iso(x + (mx + k) * m, y, z + (mz + k) * m),
      iso(x + mx * m, y, z + (mz + k) * m),
    ]);
  return (
    <g opacity={opacity} transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}>
      <polygon points={sq(0, 0, 7)} fill={ISO.accent} />
      <polygon points={sq(0.6, 4.4)} fill={ISO.ink} />
      <polygon points={sq(4.4, 4.4)} fill={ISO.ink} />
      <polygon points={sq(0.6, 0.6)} fill={ISO.ink} />
      <polygon points={sq(2.6, 2.6)} fill={ISO.ink} />
      <polygon points={sq(4.6, 0.6)} fill={ISO.ink} />
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
  const m = size / 7;
  const sq = (my: number, mz: number, k = 2) =>
    pts([
      iso(x, y + my * m, z + mz * m),
      iso(x, y + (my + k) * m, z + mz * m),
      iso(x, y + (my + k) * m, z + (mz + k) * m),
      iso(x, y + my * m, z + (mz + k) * m),
    ]);
  return (
    <g opacity={opacity} transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}>
      <polygon points={sq(0, 0, 7)} fill={ISO.accent} />
      <polygon points={sq(0.6, 4.4)} fill={ISO.ink} />
      <polygon points={sq(4.4, 4.4)} fill={ISO.ink} />
      <polygon points={sq(0.6, 0.6)} fill={ISO.ink} />
      <polygon points={sq(2.6, 2.6)} fill={ISO.ink} />
      <polygon points={sq(4.6, 0.6)} fill={ISO.ink} />
    </g>
  );
};

/** Jednoducha krabica s vekom (zatvorena) - pre sklad. Hrana vlavo dole. */
export const Carton: React.FC<{ x: number; y: number; z: number; w?: number; d?: number; h?: number; qr?: number }> = ({
  x,
  y,
  z,
  w = 40,
  d = 40,
  h = 28,
  qr = 0,
}) => (
  <g>
    <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} stroke />
    {/* veko: tenka doska presahujuca o 2 */}
    <IsoBox x={x - 2} y={y - 2} z={z + h} w={w + 4} d={d + 4} h={4} />
    {qr > 0 ? <QrOnLeftFace x={x + w * 0.3} y={y + d} z={z + h * 0.25} size={w * 0.4} s={qr} opacity={Math.min(1, qr * 1.5)} /> : null}
  </g>
);

/** Paleta: doska + tri nohy. */
export const Pallet: React.FC<{ x: number; y: number; z?: number; w?: number; d?: number }> = ({
  x,
  y,
  z = 0,
  w = 96,
  d = 96,
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
    <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} faces={{ top: ISO.top, left: ISO.top, right: ISO.right }} />
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
    {qr > 0 ? <QrOnLeftFace x={x + w * 0.18} y={y + d} z={z + h * 0.5} size={w * 0.45} s={qr} opacity={Math.min(1, qr * 1.5)} /> : null}
  </g>
);
