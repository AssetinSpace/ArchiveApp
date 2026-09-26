import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene } from '../components/Scene';
import { FOOTAGE_WINDOW_WIDE, WindowFrame } from '../components/Device';
import { pop, settle, tween } from '../lib/anim';
import { phases } from '../copy/sk';
import { BRAND, FONT, INK } from '../theme';

/**
 * C10 - Praca s databazou (kolo 36): uvod k F3 podany ako ostatne funkcie (ako C6), nie zvyraznenim menu v zazname.
 * Okno aplikacie z bielej (F4 konci do bielej), v nom tri funkcie ako karty so slovami nahovoru
 * (vyhladavat, zoskupovat, exportovat), pri "Najjednoduchsie je vyhladavanie" ostane vyhladavanie, ostatne stlmia;
 * potom okno prejde presne do okna footage F3 (FOOTAGE_WINDOW_WIDE) = strih na F3. Vpravo nadpis ako pri footage. 8,6 s.
 * Kolo 37: karty su v okne od zaciatku stlmene (okno nie je 3 s prazdne), so slovom sa rozsvietia; karty ostanu
 * pocas presunu okna a zmiznu az tesne pred strihom (bez prazdneho okna na konci).
 *
 * ms (nahovor od 300, casy slov + 300): 0 okno · 300 karty stlmene · 700 text vpravo · 2800 Vyhladavanie ·
 * 3850 Zoskupovanie · 4600 Export · 6800 zostane Vyhladavanie · 7600-8400 okno do okna F3 · 8300-8550 obsah zmizne.
 */
const WIN = { x: 380, y: 150, w: 900, h: 640 };
const CARD = { w: 230, h: 250, gap: 36 };

const Icon: React.FC<{ kind: 'search' | 'group' | 'export' }> = ({ kind }) => (
  <svg width={104} height={104} viewBox="0 0 100 100" fill="none" stroke={BRAND[600]} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round">
    {kind === 'search' ? (
      <>
        <circle cx={42} cy={42} r={25} />
        <path d="M61 61 L84 84" strokeWidth={10} />
      </>
    ) : kind === 'group' ? (
      <>
        <rect x={34} y={10} width={32} height={22} rx={5} />
        <path d="M50 32 V44 M24 44 H76 M24 44 V56 M76 44 V56" strokeWidth={6} />
        <rect x={8} y={56} width={32} height={22} rx={5} />
        <rect x={60} y={56} width={32} height={22} rx={5} />
      </>
    ) : (
      <>
        <path d="M18 56 V84 H82 V56" />
        <path d="M50 64 V14 M32 32 L50 14 L68 32" />
      </>
    )}
  </svg>
);

const CARDS = [
  { kind: 'search', label: 'Vyhľadávanie', at: 2800 },
  { kind: 'group', label: 'Zoskupovanie', at: 3850 },
  { kind: 'export', label: 'Export', at: 4600 },
] as const;

export const C10_Databaza: React.FC = () => {
  const frame = useCurrentFrame();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const chrome = tw(0, 400);
  const focus = tw(6800, 400); // zostane vyhladavanie
  const content = 1 - tw(8300, 250);
  const fill = tw(7600, 800); // okno prejde do okna F3
  const note = settle(frame, 700) * (1 - tw(7500, 300));
  const dim = settle(frame, 300); // karty su v okne od zaciatku, stlmene
  const at = {
    x: WIN.x + (FOOTAGE_WINDOW_WIDE.x - WIN.x) * fill,
    y: WIN.y + (FOOTAGE_WINDOW_WIDE.y - WIN.y) * fill,
    w: WIN.w + (FOOTAGE_WINDOW_WIDE.w - WIN.w) * fill,
    h: WIN.h + (FOOTAGE_WINDOW_WIDE.h - WIN.h) * fill,
  };
  const rowW = CARDS.length * CARD.w + (CARDS.length - 1) * CARD.gap;
  return (
    <Scene mode="light" footer footerOpacity={1 - fill}>
      <WindowFrame at={at} chrome={chrome}>
        <div style={{ position: 'absolute', left: (at.w - rowW) / 2, top: (at.h - 44 - CARD.h) / 2, display: 'flex', gap: CARD.gap, opacity: content }}>
          {CARDS.map((c, i) => {
            const t = pop(frame, c.at); // rozsvietenie so slovom
            const main = i === 0;
            return (
              <div
                key={c.kind}
                style={{
                  width: CARD.w,
                  height: CARD.h,
                  borderRadius: 18,
                  background: '#fff',
                  border: `${main ? 3 + 2 * focus : 3}px solid ${main && focus > 0 ? BRAND[500] : INK[200]}`,
                  boxShadow: main ? `0 ${10 * focus}px ${28 * focus}px rgba(31,122,51,${0.18 * focus})` : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 22,
                  opacity: dim * (0.3 + 0.7 * Math.min(1, t)) * (main ? 1 : 1 - 0.65 * focus),
                  transform: `scale(${(0.96 + 0.04 * Math.min(1, t)) * (main ? 1 + 0.06 * focus : 1)})`,
                }}
              >
                <Icon kind={c.kind} />
                <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 30, color: INK[900], letterSpacing: '-0.01em' }}>{c.label}</div>
              </div>
            );
          })}
        </div>
      </WindowFrame>
      {/* vpravo nadpis ako pri footage (StepsPanel) */}
      <div style={{ position: 'absolute', left: 1460, top: 0, width: 430, height: 1080, display: 'flex', flexDirection: 'column', justifyContent: 'center', opacity: note, transform: `translateX(${(1 - note) * 24}px)` }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 22, letterSpacing: '0.14em', textTransform: 'uppercase', color: BRAND[600], marginBottom: 14 }}>{phases.app}</div>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 56, lineHeight: 1.05, color: INK[900], letterSpacing: '-0.02em', marginBottom: 14 }}>Práca s databázou</div>
        <div style={{ fontFamily: FONT.body, fontWeight: 400, fontSize: 30, lineHeight: 1.35, color: INK[500] }}>Vyhľadávanie, zoskupovanie aj exporty.</div>
      </div>
    </Scene>
  );
};
