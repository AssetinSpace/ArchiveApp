import React from 'react';
import { BRAND, INK } from '../theme';

/**
 * Ikony krátkej LinkedIn verzie pre dlhú verziu (kolo 52, Samuel: preniesť aj zvyšok obrazu krátkej). Kópia zo
 * scenes/kratka/LinkedIn.tsx (HIcon, QrBadge, OfferIcon); krátka verzia ostáva bez zmeny a kreslí si svoje.
 *
 * `HIcon`: hierarchia archívu (polica, krabica, šanón, zložka, dokument), obrys v kruhu, zelená keď je `on`.
 * `QrBadge`: nálepka QR (biela, čierne rohy ako na hárku v C5) v pravom hornom rohu ikony, `t` 0 až 1 = dopad.
 * `OfferIcon`: ikony ponuky (krabica, aplikácia, server, oblak, štít, katalóg).
 */
export type HKind = 'shelf' | 'box' | 'binder' | 'folder' | 'doc';
export const HIcon: React.FC<{ kind: HKind; size: number; on: boolean }> = ({ kind, size, on }) => (
  <div style={{ width: size, height: size, borderRadius: size / 2, flex: 'none', background: on ? BRAND[50] : '#fff', border: `3px solid ${on ? BRAND[400] : INK[200]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: on ? '0 10px 26px rgba(31,122,51,0.18)' : 'none' }}>
    <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 48 48" fill="none" stroke={on ? BRAND[600] : INK[400]} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      {kind === 'shelf' ? (
        <>
          <path d="M7 4 V44 M41 4 V44 M7 17 H41 M7 30 H41 M7 43 H41" />
          <rect x={11} y={8} width={11} height={9} rx={1} />
          <rect x={25} y={21} width={12} height={9} rx={1} />
          <rect x={12} y={34} width={10} height={9} rx={1} />
        </>
      ) : kind === 'box' ? (
        <>
          <rect x={6} y={10} width={36} height={9} rx={2} />
          <path d="M9 19 V38 a2 2 0 0 0 2 2 H37 a2 2 0 0 0 2 -2 V19" />
          <path d="M19 27 H29" />
        </>
      ) : kind === 'binder' ? (
        <>
          <rect x={13} y={4} width={22} height={40} rx={2.5} />
          <rect x={18} y={10} width={12} height={9} rx={1} />
          <circle cx={24} cy={33} r={3.5} />
        </>
      ) : kind === 'folder' ? (
        <path d="M5 13 a3 3 0 0 1 3 -3 H18 l4 5 H40 a3 3 0 0 1 3 3 V37 a3 3 0 0 1 -3 3 H8 a3 3 0 0 1 -3 -3 Z" />
      ) : (
        <>
          <path d="M12 4 H29 L37 12 V44 H12 Z" />
          <path d="M29 4 V12 H37" />
          <path d="M17 21 H32 M17 27 H32 M17 33 H27" />
        </>
      )}
    </svg>
  </div>
);

export const QrBadge: React.FC<{ size: number; t: number }> = ({ size, t }) => (
  <div style={{ position: 'absolute', right: -size * 0.28, top: -size * 0.22, width: size, height: size, borderRadius: size * 0.16, background: '#fff', border: `2px solid ${INK[300]}`, boxShadow: '0 6px 14px rgba(15,23,42,0.18)', opacity: Math.min(1, t * 1.4), transform: `scale(${0.4 + 0.6 * t}) rotate(${(1 - t) * -20}deg)` }}>
    <svg width={size - 4} height={size - 4} viewBox="0 0 36 36" style={{ display: 'block' }}>
      {[[4, 4], [20, 4], [4, 20]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y} width={12} height={12} fill={INK[900]} />
          <rect x={x + 3} y={y + 3} width={6} height={6} fill="#fff" />
          <rect x={x + 4.5} y={y + 4.5} width={3} height={3} fill={INK[900]} />
        </g>
      ))}
      {[[20, 20], [27, 24], [23, 29], [29, 30], [20, 28]].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width={4} height={4} fill={INK[900]} />
      ))}
    </svg>
  </div>
);

export type OfferIconKind = 'box' | 'app' | 'server' | 'cloud' | 'shield' | 'catalog';
export const OfferIcon: React.FC<{ kind: OfferIconKind; on: boolean; size?: number }> = ({ kind, on, size = 84 }) => (
  <div style={{ width: size, height: size, borderRadius: size / 2, background: on ? BRAND[50] : '#fff', border: `2px solid ${on ? BRAND[300] : INK[200]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
    <svg width={size * 0.54} height={size * 0.54} viewBox="0 0 48 48" fill="none" stroke={on ? BRAND[600] : INK[400]} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      {kind === 'box' ? (
        <>
          <rect x={6} y={10} width={36} height={9} rx={2} />
          <path d="M9 19 V38 a2 2 0 0 0 2 2 H37 a2 2 0 0 0 2 -2 V19" />
          <path d="M19 27 H29" />
        </>
      ) : kind === 'app' ? (
        <>
          <rect x={6} y={9} width={36} height={24} rx={3} />
          <path d="M3 39 H45" />
          <circle cx={22} cy={20} r={5} />
          <path d="M26 24 L30 28" />
        </>
      ) : kind === 'server' ? (
        <>
          <rect x={8} y={7} width={32} height={14} rx={3} />
          <rect x={8} y={27} width={32} height={14} rx={3} />
          <path d="M14 14 H15 M14 34 H15 M22 14 H33 M22 34 H33" />
        </>
      ) : kind === 'cloud' ? (
        <path d="M14 37 H35 a8 8 0 0 0 1 -15.9 A11 11 0 0 0 15 18.5 A9.3 9.3 0 0 0 14 37 Z" />
      ) : kind === 'catalog' ? (
        <>
          <rect x={6} y={7} width={36} height={9} rx={2} />
          <rect x={6} y={20} width={36} height={9} rx={2} />
          <rect x={6} y={33} width={36} height={9} rx={2} />
          <path d="M11 11.5 H14 M11 24.5 H14 M11 37.5 H14" />
        </>
      ) : (
        <>
          <path d="M24 4 L40 10 V22 C40 32 33 40 24 44 C15 40 8 32 8 22 V10 Z" />
          <path d="M16.5 23.5 L22 29 L32 18" />
        </>
      )}
    </svg>
  </div>
);
