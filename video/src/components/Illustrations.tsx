import React from 'react';
import { BRAND, INK, ISO } from '../theme';
import { iso, pts } from '../lib/iso';

/** Minimalisticka postavicka (hlava + trup), v mierke iso scen. */
export const Person: React.FC<{ x: number; y: number; scale?: number; color?: string; opacity?: number }> = ({
  x,
  y,
  scale = 1,
  color = INK[900],
  opacity = 1,
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
    <ellipse cx={0} cy={0} rx={16} ry={8} fill="rgba(0,0,0,0.18)" />
    <path d="M-13 -4 L-13 -46 Q-13 -58 0 -58 Q13 -58 13 -46 L13 -4 Z" fill={color} />
    <circle cx={0} cy={-72} r={13} fill={color} />
  </g>
);

/** Otaznik v bubline. */
export const QuestionMark: React.FC<{ x: number; y: number; s?: number; color?: string }> = ({ x, y, s = 1, color = BRAND[300] }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={Math.min(1, s * 1.4)}>
    <circle cx={0} cy={0} r={18} fill={color} />
    <text x={0} y={8} textAnchor="middle" fontFamily="Manrope" fontWeight={800} fontSize={26} fill={INK[900]}>
      ?
    </text>
  </g>
);

/** Zeleny check v kruhu. */
export const Check: React.FC<{ x: number; y: number; s?: number; r?: number }> = ({ x, y, s = 1, r = 18 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={Math.min(1, s * 1.4)}>
    <circle cx={0} cy={0} r={r} fill={BRAND[600]} />
    <path d={`M${-r * 0.45} 0 L${-r * 0.12} ${r * 0.35} L${r * 0.5} ${-r * 0.35}`} fill="none" stroke="#fff" strokeWidth={r * 0.2} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

/** Plocha (podlaha) skladu v iso: obdlznik w x d na z=0. */
export const Floor: React.FC<{ x: number; y: number; w: number; d: number; fill?: string; edge?: string }> = ({ x, y, w, d, fill = ISO.left, edge = ISO.right }) => (
  <g>
    <polygon points={pts([iso(x, y, 0), iso(x + w, y, 0), iso(x + w, y + d, 0), iso(x, y + d, 0)])} fill={fill} />
    <polygon points={pts([iso(x, y + d, 0), iso(x + w, y + d, 0), iso(x + w, y + d, -8), iso(x, y + d, -8)])} fill={edge} />
    <polygon points={pts([iso(x + w, y, 0), iso(x + w, y + d, 0), iso(x + w, y + d, -8), iso(x + w, y, -8)])} fill={ISO.edge} />
  </g>
);

/** Dokument (list A4) v 2D s riadkami textu, volitelne peciatka. */
export const Sheet: React.FC<{ w?: number; h?: number; lines?: number; stamp?: boolean; qr?: boolean; title?: boolean }> = ({
  w = 220,
  h = 300,
  lines = 7,
  stamp,
  qr,
  title = true,
}) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
    <rect x={1} y={1} width={w - 2} height={h - 2} rx={6} fill="#fff" stroke={ISO.edge} strokeWidth={2.2} />
    {title ? <rect x={w * 0.14} y={h * 0.1} width={w * 0.72} height={h * 0.05} rx={3} fill={ISO.ink} /> : null}
    {Array.from({ length: lines }).map((_, i) => (
      <rect key={i} x={w * 0.14} y={h * 0.22 + i * (h * 0.07)} width={w * (0.72 - (i % 3) * 0.14)} height={h * 0.028} rx={2} fill={ISO.right} />
    ))}
    {stamp ? (
      <g transform={`translate(${w * 0.68} ${h * 0.8}) rotate(-12)`}>
        <circle r={w * 0.13} fill="none" stroke={BRAND[600]} strokeWidth={3} />
        <circle r={w * 0.09} fill="none" stroke={BRAND[600]} strokeWidth={2} />
      </g>
    ) : null}
    {qr ? (
      <g transform={`translate(${w * 0.7} ${h * 0.76})`}>
        {(() => {
          const q = w * 0.22;
          const m = q / 9;
          const finder = (fx: number, fy: number, i: number) => (
            <g key={i}>
              <rect x={fx * m} y={fy * m} width={3 * m} height={3 * m} fill={ISO.ink} />
              <rect x={(fx + 0.6) * m} y={(fy + 0.6) * m} width={1.8 * m} height={1.8 * m} fill="#fff" />
              <rect x={(fx + 1.1) * m} y={(fy + 1.1) * m} width={0.8 * m} height={0.8 * m} fill={ISO.ink} />
            </g>
          );
          return (
            <g>
              <rect width={q} height={q} fill="#fff" stroke={ISO.edge} strokeWidth={0.8} />
              {finder(1, 1, 0)}
              {finder(5, 1, 1)}
              {finder(1, 5, 2)}
              {[
                [5, 5],
                [7, 5],
                [6, 6],
                [5, 7],
                [7, 7],
                [1, 4],
                [2, 4],
                [4, 1],
                [4, 3],
                [4, 4],
                [6, 4],
                [4, 6],
                [3, 5],
              ].map(([mx, my], i) => (
                <rect key={i} x={mx * m} y={my * m} width={m} height={m} fill={ISO.ink} />
              ))}
            </g>
          );
        })()}
      </g>
    ) : null}
  </svg>
);

/** Cenovka (tag) so sumou/textom. */
export const PriceTag: React.FC<{ text: string; s?: number; color?: string }> = ({ text, s = 1, color = INK[900] }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 20px 10px 16px',
      borderRadius: 10,
      background: color,
      color: '#fff',
      fontFamily: 'Inter',
      fontWeight: 600,
      fontSize: 26,
      whiteSpace: 'nowrap',
      opacity: Math.min(1, s * 1.4),
      transform: `scale(${0.6 + 0.4 * s})`,
      transformOrigin: 'left center',
    }}
  >
    <span style={{ width: 10, height: 10, borderRadius: 5, background: '#fff', opacity: 0.7 }} />
    {text}
  </div>
);

/** Chip metadat: nazov + hodnota + badge. */
export const Chip: React.FC<{
  label: string;
  value: React.ReactNode;
  badge?: string;
  badgeColor?: 'amber' | 'green';
  t?: number;
  width?: number;
  right?: React.ReactNode;
  highlight?: boolean;
}> = ({ label, value, badge, badgeColor = 'amber', t = 1, width = 620, right, highlight }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      width,
      padding: '18px 24px',
      borderRadius: 12,
      background: highlight ? BRAND[50] : '#fff',
      border: `2px solid ${highlight ? BRAND[300] : INK[200]}`,
      boxShadow: '0 2px 6px rgba(15,23,42,0.06)',
      opacity: t,
      transform: `translateY(${(1 - t) * 24}px)`,
      fontFamily: 'Inter',
    }}
  >
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 20, color: INK[500], fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 27, color: INK[900], fontWeight: 600, marginTop: 4, lineHeight: 1.2 }}>{value}</div>
    </div>
    {badge ? (
      <div
        style={{
          padding: '6px 14px',
          borderRadius: 999,
          fontSize: 20,
          fontWeight: 600,
          background: badgeColor === 'green' ? BRAND[100] : '#FEF3C7',
          color: badgeColor === 'green' ? BRAND[800] : '#92400E',
        }}
      >
        {badge}
      </div>
    ) : null}
    {right}
  </div>
);

/** Fotka stitku (karta s "fotografiou" dokumentu) - schematicka. */
export const PhotoCard: React.FC<{ w?: number; h?: number; t?: number }> = ({ w = 380, h = 480, t = 1 }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: 14,
      background: INK[100],
      border: `2px solid ${INK[200]}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: t,
      transform: `translateY(${(1 - t) * 24}px)`,
      overflow: 'hidden',
    }}
  >
    <div style={{ transform: 'rotate(-3deg)' }}>
      <Sheet w={w * 0.7} h={h * 0.78} lines={8} qr stamp />
    </div>
  </div>
);
