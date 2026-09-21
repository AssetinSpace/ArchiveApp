import React from 'react';
import { ISO } from '../theme';

/**
 * Doslovny port dlazdice "Neprehladny archiv" z assetin.sk
 * (src/components/QuickStart.astro, riadky 288-346). viewBox 0 0 240 240.
 *
 * Namiesto CSS :hover prechodov su stavy riadene props 0..1:
 *  - lid      veko: translateY(-86) scaleY(0.55) okolo (120,120)
 *  - binders  tri zlozky (zdola nahor): translateY(-40)
 *  - qr       styri nalepky (3 zlozky + krabica): scale 0->1, opacity
 * Casovanie z webu (ms): veko 520, zlozky 420 s delay 100/170/240,
 * QR 280 s delay 420/500/580/680 - pozri lib/anim.tween.
 */
export type ArchiveBoxState = {
  lid: number;
  binders: [number, number, number];
  qr: [number, number, number, number];
  /** 0..1: predna zlozka je vytiahnuta z krabice (doprava von, nad vsetko) */
  pull?: number;
};

export const archiveBoxClosed: ArchiveBoxState = { lid: 0, binders: [0, 0, 0], qr: [0, 0, 0, 0] };
export const archiveBoxOpen: ArchiveBoxState = { lid: 1, binders: [1, 1, 1], qr: [1, 1, 1, 1] };

/**
 * QR nalepka: biela plocha (geometria z dlazdice), ink moduly z dlazdice
 * a tri finder stvorce v rohoch - aby aj laik na prvy pohlad videl QR.
 * Finder stvorce sa odvodzuju z nalepky: p0..p3 = rohy stvoruholnika.
 */
const Qr: React.FC<{ s: number; cx: number; cy: number; accent: string; paths: string[] }> = ({ s, cx, cy, paths }) => {
  const nums = paths[0].match(/-?[\d.]+/g)!.map(Number);
  const P: [number, number][] = [
    [nums[0], nums[1]],
    [nums[2], nums[3]],
    [nums[4], nums[5]],
    [nums[6], nums[7]],
  ];
  // bilinearna interpolacia vnutri stvoruholnika (u pozdlz P0->P1, v pozdlz P0->P3)
  const at = (u: number, v: number): [number, number] => {
    const ax = P[0][0] + (P[1][0] - P[0][0]) * u,
      ay = P[0][1] + (P[1][1] - P[0][1]) * u;
    const bx = P[3][0] + (P[2][0] - P[3][0]) * u,
      by = P[3][1] + (P[2][1] - P[3][1]) * u;
    return [ax + (bx - ax) * v, ay + (by - ay) * v];
  };
  const quad = (u0: number, v0: number, k: number) => [at(u0, v0), at(u0 + k, v0), at(u0 + k, v0 + k), at(u0, v0 + k)].map((p) => p.join(',')).join(' ');
  const finders: [number, number][] = [
    [0.08, 0.08],
    [0.62, 0.08],
    [0.08, 0.62],
  ];
  return (
    <g opacity={Math.min(1, s * 1.3)} transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}>
      <path fill="#fff" stroke={ISO.edge} strokeWidth={0.8} d={paths[0]} />
      {finders.map(([u, v], i) => (
        <g key={i}>
          <polygon points={quad(u, v, 0.3)} fill={ISO.ink} />
          <polygon points={quad(u + 0.06, v + 0.06, 0.18)} fill="#fff" />
          <polygon points={quad(u + 0.1, v + 0.1, 0.1)} fill={ISO.ink} />
        </g>
      ))}
      {[
        [0.62, 0.62, 0.1],
        [0.78, 0.74, 0.1],
        [0.64, 0.82, 0.1],
        [0.45, 0.45, 0.1],
        [0.45, 0.1, 0.1],
        [0.1, 0.45, 0.1],
        [0.82, 0.48, 0.1],
        [0.45, 0.25, 0.1],
        [0.25, 0.45, 0.1],
        [0.72, 0.62, 0.08],
        [0.56, 0.72, 0.08],
        [0.45, 0.6, 0.08],
        [0.8, 0.86, 0.08],
      ].map(([u, v, k], i) => (
        <polygon key={`d${i}`} points={quad(u, v, k)} fill={ISO.ink} />
      ))}
    </g>
  );
};

/** px na 1 cm pri danej velkosti komponentu (krabica ~136 vb-jednotiek = 52 cm). */
export const archiveBoxPxPerCm = (size: number) => ((size / 240) * 136) / 52;

export const ArchiveBox: React.FC<{ state: ArchiveBoxState; size?: number; accent?: string; showQr?: boolean; style?: React.CSSProperties }> = ({
  state,
  size = 240,
  accent = ISO.accent,
  showQr = true,
  style,
}) => {
  const { lid, binders, qr } = state;
  const pull = state.pull ?? 0;
  const binder0 = (
    <g>
        <g transform={`translate(0 ${-40 * binders[0]})`}>
          <path fill="#9ca3af" d="M105 181.5L113 177.5L113 127.5L105 131.5Z" />
          <path fill="#e5e7eb" d="M73 165.5L105 181.5L105 131.5L73 115.5Z" />
          <path fill="#e5e7eb" d="M73 115.5L105 131.5L113 127.5L81 111.5Z" />
          <path fill="none" stroke="#6b7280" strokeWidth="2.2" strokeLinecap="round" d="M73 115.5L105 131.5" />
          {/* stitok zlozky (text na prednej ploche, pod QR) */}
          <g transform={`matrix(1 0.5 0 1 73 115.5)`}>
            <text x={4} y={41} fontFamily="Inter, sans-serif" fontWeight={700} fontSize={5.2} fill="#1f2937">PROJEKT</text>
            <text x={4} y={47.5} fontFamily="Inter, sans-serif" fontWeight={500} fontSize={4.6} fill="#6b7280">2018</text>
          </g>
          {showQr ? (
            <Qr
              s={qr[0]}
              cx={86}
              cy={135}
              accent={accent}
              paths={[
                'M79 124.5L93 131.5L93 145.5L79 138.5Z',
                'M80.12 127.06L84.12 129.06L84.12 133.06L80.12 131.06Z',
                'M87.4 130.7L91.4 132.7L91.4 136.7L87.4 134.7Z',
                'M80.12 133.06L84.12 135.06L84.12 139.06L80.12 137.06Z',
                'M84.04 132.02L88.04 134.02L88.04 138.02L84.04 136.02Z',
                'M88.24 138.12L92.24 140.12L92.24 144.12L88.24 142.12Z',
              ]}
            />
          ) : null}
        </g>
    </g>
  );
  const lidT = `translate(120 120) translate(0 ${-86 * lid}) scale(1 ${1 - 0.45 * lid}) translate(-120 -120)`;
  return (
    <svg width={size} height={size} viewBox="0 0 240 240" style={{ display: 'block', ...style }}>
      <g>
        {/* podstavec */}
        <path fill="#d1d5db" d="M120 108.13L219.75 158L120 207.88L20.25 158Z" />
        <path fill="#9ca3af" d="M20.25 158L120 207.88L120 217.88L20.25 168Z" />
        <path fill="#6b7280" d="M120 207.88L219.75 158L219.75 168L120 217.88Z" />
        {/* dno a zadne steny krabice */}
        <path fill="#1f2937" d="M62.24 110.08L103.84 130.88L177.76 93.92L136.16 73.12Z" />
        <path fill="#9ca3af" d="M136.16 73.12L177.76 93.92L177.76 115.92L136.16 95.12Z" />
        <path fill="#6b7280" d="M62.24 110.08L136.16 73.12L136.16 95.12L62.24 132.08Z" />
        <path fill="#e5e7eb" d="M188 94L136 68L136.16 73.12L177.76 93.92Z" />
        <path fill="#e5e7eb" d="M136 68L52 110L62.24 110.08L136.16 73.12Z" />
        {/* zlozka 3 (zadna) */}
        <g transform={`translate(0 ${-40 * binders[2]})`}>
          <path fill="#9ca3af" d="M161 153.5L169 149.5L169 99.5L161 103.5Z" />
          <path fill="#e5e7eb" d="M129 137.5L161 153.5L161 103.5L129 87.5Z" />
          <path fill="#e5e7eb" d="M129 87.5L161 103.5L169 99.5L137 83.5Z" />
          <path fill="none" stroke="#6b7280" strokeWidth="2.2" strokeLinecap="round" d="M129 87.5L161 103.5" />
          {/* stitok zlozky (text na prednej ploche, pod QR) */}
          <g transform={`matrix(1 0.5 0 1 129 87.5)`}>
            <text x={4} y={41} fontFamily="Inter, sans-serif" fontWeight={700} fontSize={5.2} fill="#1f2937">STAVBA</text>
            <text x={4} y={47.5} fontFamily="Inter, sans-serif" fontWeight={500} fontSize={4.6} fill="#6b7280">B2</text>
          </g>
          {showQr ? (
            <Qr
              s={qr[2]}
              cx={142}
              cy={107}
              accent={accent}
              paths={[
                'M135 96.5L149 103.5L149 117.5L135 110.5Z',
                'M136.12 99.06L140.12 101.06L140.12 105.06L136.12 103.06Z',
                'M143.4 102.7L147.4 104.7L147.4 108.7L143.4 106.7Z',
                'M136.12 105.06L140.12 107.06L140.12 111.06L136.12 109.06Z',
                'M140.04 104.02L144.04 106.02L144.04 110.02L140.04 108.02Z',
                'M144.24 110.12L148.24 112.12L148.24 116.12L144.24 114.12Z',
              ]}
            />
          ) : null}
        </g>
        {/* zlozka 2 (stredna) */}
        <g transform={`translate(0 ${-40 * binders[1]})`}>
          <path fill="#9ca3af" d="M133 167.5L141 163.5L141 113.5L133 117.5Z" />
          <path fill="#e5e7eb" d="M101 151.5L133 167.5L133 117.5L101 101.5Z" />
          <path fill="#e5e7eb" d="M101 101.5L133 117.5L141 113.5L109 97.5Z" />
          <path fill="none" stroke="#6b7280" strokeWidth="2.2" strokeLinecap="round" d="M101 101.5L133 117.5" />
          {/* stitok zlozky (text na prednej ploche, pod QR) */}
          <g transform={`matrix(1 0.5 0 1 101 101.5)`}>
            <text x={4} y={41} fontFamily="Inter, sans-serif" fontWeight={700} fontSize={5.2} fill="#1f2937">ZMLUVY</text>
            <text x={4} y={47.5} fontFamily="Inter, sans-serif" fontWeight={500} fontSize={4.6} fill="#6b7280">2016</text>
          </g>
          {showQr ? (
            <Qr
              s={qr[1]}
              cx={114}
              cy={121}
              accent={accent}
              paths={[
                'M107 110.5L121 117.5L121 131.5L107 124.5Z',
                'M108.12 113.06L112.12 115.06L112.12 119.06L108.12 117.06Z',
                'M115.4 116.7L119.4 118.7L119.4 122.7L115.4 120.7Z',
                'M108.12 119.06L112.12 121.06L112.12 125.06L108.12 123.06Z',
                'M112.04 118.02L116.04 120.02L116.04 124.02L112.04 122.02Z',
                'M116.24 124.12L120.24 126.12L120.24 130.12L116.24 128.12Z',
              ]}
            />
          ) : null}
        </g>
        {pull > 0 ? null : binder0}
        {/* predne steny krabice */}
        <path fill="#e5e7eb" d="M52 110L104 136L103.84 130.88L62.24 110.08Z" />
        <path fill="#e5e7eb" d="M104 136L188 94L177.76 93.92L103.84 130.88Z" />
        <path fill="#d1d5db" d="M52 110L104 136L104 192L52 166Z" />
        <path fill="#1f2937" d="M66 131L90 143L90 152L66 140Z" />
        <path fill="#6b7280" d="M66 137L90 149L90 152L66 140Z" />
        <path fill="#9ca3af" d="M104 136L188 94L188 150L104 192Z" />
        {showQr ? (
          <Qr
            s={qr[3]}
            cx={140.49}
            cy={145.75}
            accent={accent}
            paths={[
              'M132.49 141.75L148.49 133.75L148.49 149.75L132.49 157.75Z',
              'M133.77 143.4L138.34 141.11L138.34 145.69L133.77 147.97Z',
              'M142.09 139.24L146.66 136.95L146.66 141.53L142.09 143.81Z',
              'M133.77 150.26L138.34 147.97L138.34 152.54L133.77 154.83Z',
              'M138.25 144.59L142.82 142.3L142.82 146.87L138.25 149.16Z',
              'M143.05 146.76L147.62 144.47L147.62 149.05L143.05 151.33Z',
            ]}
          />
        ) : null}
        <path fill="none" stroke="#6b7280" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M52 166L104 192L188 150" />
        {/* veko */}
        <g transform={lidT}>
          <path fill="#e5e7eb" d="M46 104L104 133L194 88L136 59Z" />
          <path fill="#d1d5db" d="M46 104L104 133L104 146L46 117Z" />
          <path fill="#9ca3af" d="M104 133L194 88L194 101L104 146Z" />
          <path fill="none" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round" d="M46 117L104 146" />
          <path fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" d="M104 146L194 101" />
        </g>
        {/* vytiahnuta predna zlozka: von z krabice doprava-dopredu, nad vsetkym */}
        {pull > 0 ? <g transform={`translate(${78 * pull} ${34 * pull})`}>{binder0}</g> : null}
      </g>
    </svg>
  );
};

/**
 * Stav dlazdice v case, presne podla CSS na webe (ms od zaciatku `startMs`).
 */
export const archiveBoxAt = (
  tween: (startMs: number, durMs: number) => number,
  startMs = 0,
): ArchiveBoxState => ({
  lid: tween(startMs, 520),
  binders: [tween(startMs + 100, 420), tween(startMs + 170, 420), tween(startMs + 240, 420)],
  qr: [tween(startMs + 420, 280), tween(startMs + 500, 280), tween(startMs + 580, 280), tween(startMs + 680, 280)],
});
