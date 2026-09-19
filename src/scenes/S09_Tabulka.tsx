import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene } from '../components/Scene';
import { TextColumn } from '../components/Text';
import { Carton, Pallet, ShelfFrame } from '../lib/iso';
import { linear, pop, settle, tween } from '../lib/anim';
import { sk } from '../copy/sk';
import { BRAND, FONT, INK, ms } from '../theme';

/**
 * S09 - Tabulka a hladanie: do pola sa pise dotaz, riadky sa prefiltruju
 * na jeden, vyskoci breadcrumb PL/KR/ZL a v mini-sklade sa rozsvieti
 * konkretna krabica. 8 s.
 */
const T = sk.S09;
const ROWS = 9;
const HIT = 5;

export const S09_Tabulka: React.FC = () => {
  const frame = useCurrentFrame();
  const table = settle(frame, 700);
  const typed = Math.floor(linear(frame, 1500, 1800) * T.query.length);
  const caret = frame % 16 < 8 && frame < ms(3600);
  const filter = tween(frame, 3500, 600);
  const crumb = pop(frame, 4400);
  const light = tween(frame, 5000, 500);

  return (
    <Scene mode="light">
      <TextColumn kicker={T.kicker} lines={T.h} body={T.p} tKicker={settle(frame, 0)} tLines={[settle(frame, 150), settle(frame, 280)]} tBody={settle(frame, 600)} width={800} headlineSize={54} top={130} />

      {/* tabulka */}
      <div
        style={{
          position: 'absolute',
          left: 940,
          top: 150,
          width: 860,
          borderRadius: 14,
          border: `2px solid ${INK[200]}`,
          background: '#fff',
          boxShadow: '0 4px 14px rgba(15,23,42,0.06)',
          opacity: table,
          transform: `translateY(${(1 - table) * 24}px)`,
          overflow: 'hidden',
          fontFamily: FONT.body,
        }}
      >
        {/* vyhladavanie */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderBottom: `1px solid ${INK[200]}`, background: INK[50] }}>
          <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={INK[500]} strokeWidth={2.4} strokeLinecap="round">
            <circle cx={10.5} cy={10.5} r={6.5} />
            <path d="M15.5 15.5 L21 21" />
          </svg>
          <div style={{ flex: 1, height: 48, borderRadius: 8, border: `2px solid ${typed > 0 ? BRAND[400] : INK[200]}`, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 24, color: INK[900] }}>
            {T.query.slice(0, typed)}
            <span style={{ width: 2, height: 28, background: INK[900], marginLeft: 2, opacity: caret ? 1 : 0 }} />
            {typed === 0 ? <span style={{ color: INK[400] }}>Hľadať…</span> : null}
          </div>
        </div>
        {/* hlavicka */}
        <div style={{ display: 'flex', padding: '10px 20px', fontSize: 16, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: INK[500], borderBottom: `1px solid ${INK[200]}` }}>
          {T.cols.map((c, i) => (
            <div key={i} style={{ flex: i === 1 ? 2.2 : 1 }}>
              {c}
            </div>
          ))}
        </div>
        {/* riadky */}
        {Array.from({ length: ROWS }).map((_, r) => {
          const hit = r === HIT;
          const h = hit ? 58 : 58 * (1 - filter);
          const op = hit ? 1 : 1 - filter;
          return (
            <div
              key={r}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px',
                height: h,
                opacity: op,
                background: hit && filter > 0.5 ? BRAND[50] : '#fff',
                borderBottom: `1px solid ${INK[100]}`,
                overflow: 'hidden',
              }}
            >
              {T.cols.map((_, c) => (
                <div key={c} style={{ flex: c === 1 ? 2.2 : 1, paddingRight: 16 }}>
                  {hit && c === 0 ? (
                    <span style={{ fontSize: 22, fontWeight: 600, color: INK[900] }}>zlozka_{r + 1}</span>
                  ) : hit && c === 1 && filter > 0.5 ? (
                    <span style={{ fontSize: 22, color: INK[900] }}>Kolaudačné rozhodnutie · Slnečná 12</span>
                  ) : (
                    <div style={{ height: 12, borderRadius: 4, background: hit ? INK[400] : INK[200], width: `${45 + ((r * 11 + c * 17) % 50)}%` }} />
                  )}
                </div>
              ))}
            </div>
          );
        })}
        {/* breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px', background: INK[50], borderTop: `1px solid ${INK[200]}`, opacity: crumb, transform: `translateY(${(1 - crumb) * 14}px)` }}>
          <span style={{ fontSize: 20, color: INK[500], marginRight: 8 }}>Fyzická lokácia</span>
          {T.crumb.map((c, i) => (
            <React.Fragment key={i}>
              {i ? <span style={{ color: INK[400], fontSize: 22 }}>/</span> : null}
              <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 24, fontWeight: 600, color: i === T.crumb.length - 1 ? BRAND[700] : INK[800], background: i === T.crumb.length - 1 ? BRAND[100] : '#fff', border: `1px solid ${INK[200]}`, borderRadius: 6, padding: '4px 10px' }}>
                {c}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* mini sklad: rozsvieti sa konkretna krabica */}
      <svg width={520} height={400} viewBox="-120 -140 340 260" style={{ position: 'absolute', left: 1120, top: 560, opacity: filter }}>
        <Pallet x={0} y={0} w={90} d={90} />
        <ShelfFrame x={110} y={0} w={80} d={44} levels={2} levelH={40} />
        {[0, 1].map((lvl) => [0, 1].map((k) => <Carton key={`${lvl}${k}`} x={118 + k * 36} y={6} z={lvl * 40 + 5} w={30} d={30} h={24} qr={lvl === 1 && k === 0 ? light : 0} />))}
        <Carton x={6} y={6} z={14} w={36} d={36} h={28} />
        <Carton x={46} y={6} z={14} w={36} d={36} h={28} />
        <Carton x={6} y={46} z={14} w={36} d={36} h={28} />
        <Carton x={46} y={46} z={14} w={36} d={36} h={28} />
        {light > 0 ? (
          <g opacity={light}>
            <circle cx={92} cy={28} r={40 * light} fill={BRAND[200]} opacity={0.35} />
          </g>
        ) : null}
      </svg>
    </Scene>
  );
};
