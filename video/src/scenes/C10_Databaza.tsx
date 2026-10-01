import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene } from '../components/Scene';
import { WindowFrame } from '../components/Device';
import { APP_WIN, StepLabel } from '../components/Frame16';
import { pop, settle, tween } from '../lib/anim';
import { phases } from '../copy/sk';
import { BRAND, FONT, INK } from '../theme';

/**
 * C10 - Praca s databazou (kolo 36): uvod k F3 podany ako ostatne funkcie (ako C6), nie zvyraznenim menu v zazname.
 * Okno aplikacie z bielej (F4 konci do bielej), v nom tri funkcie ako karty so slovami nahovoru
 * (vyhladavat, zoskupovat, exportovat), pri "Najjednoduchsie je vyhladavanie" ostane vyhladavanie, ostatne stlmia;
 * potom okno prejde presne do okna footage F3 (FOOTAGE_WINDOW_WIDE) = strih na F3. Vpravo nadpis ako pri footage. 9,0 s.
 * Kolo 40: text Samuela "Vytvorenu databazu katalogu archivu vieme exportovat, analyzovat alebo prehladavat." + "Najjednoduchsie je vyhladavanie.";
 * karty Export / Analyza / Vyhladavanie v poradi slov, zostane Vyhladavanie (vpravo); okno do F3 8,0-8,8 s, obsah zmizne 8,7-8,95 s.
 * Kolo 37: karty su v okne od zaciatku stlmene (okno nie je 3 s prazdne), so slovom sa rozsvietia; karty ostanu
 * pocas presunu okna a zmiznu az tesne pred strihom (bez prazdneho okna na konci).
 *
 * ms (nahovor od 300, casy slov + 300): 0 okno · 300 karty stlmene · 700 text vpravo · 2800 Vyhladavanie ·
 * 3850 Zoskupovanie · 4600 Export · 6800 zostane Vyhladavanie · 7600-8400 okno do okna F3 · 8300-8550 obsah zmizne.
 * Kolo 50: okno do APP_WIN (okno F3 na celu sirku), nadpis kroku hore vlavo.
 */
// kolo 52 (Samuel: rozlozenie ako v kratkej verzii): okno od zaciatku APP_WIN ako vsetky okna aplikacie (predtym mensie
// v strede od 510 px a na konci sa zvacsilo), karty vacsie; F3 nadvazuje v tom istom okne
const WIN = APP_WIN;
const CARD = { w: 340, h: 360, gap: 60 };

const Icon: React.FC<{ kind: 'search' | 'chart' | 'export' }> = ({ kind }) => (
  <svg width={140} height={140} viewBox="0 0 100 100" fill="none" stroke={BRAND[600]} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round">
    {kind === 'search' ? (
      <>
        <circle cx={42} cy={42} r={25} />
        <path d="M61 61 L84 84" strokeWidth={10} />
      </>
    ) : kind === 'chart' ? (
      <>
        <path d="M14 14 V86 H88" />
        <path d="M32 70 V52 M52 70 V34 M72 70 V46" strokeWidth={10} />
      </>
    ) : (
      <>
        <path d="M18 56 V84 H82 V56" />
        <path d="M50 64 V14 M32 32 L50 14 L68 32" />
      </>
    )}
  </svg>
);

// kolo 40: poradie a slova podla vety "...vieme exportovat, analyzovat alebo prehladavat" (casy slov + 300 ms)
const CARDS = [
  { kind: 'export', label: 'Export', at: 3000 },
  { kind: 'chart', label: 'Analýza', at: 4100 },
  { kind: 'search', label: 'Vyhľadávanie', at: 5200 },
] as const;
const MAIN = 2; // zostane vyhladavanie

export const C10_Databaza: React.FC = () => {
  const frame = useCurrentFrame();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const chrome = tw(0, 400);
  const focus = tw(7100, 400); // zostane vyhladavanie (slovo "vyhladavanie" 7,2 s)
  const content = 1 - tw(8700, 250);
  const dim = settle(frame, 300); // karty su v okne od zaciatku, stlmene
  const at = WIN; // kolo 52: okno uz je v polohe okna F3
  const rowW = CARDS.length * CARD.w + (CARDS.length - 1) * CARD.gap;
  return (
    <Scene mode="light">
      <WindowFrame at={at} chrome={chrome}>
        <div style={{ position: 'absolute', left: (at.w - rowW) / 2, top: (at.h - 44 - CARD.h) / 2, display: 'flex', gap: CARD.gap, opacity: content }}>
          {CARDS.map((c, i) => {
            const t = pop(frame, c.at); // rozsvietenie so slovom
            const main = i === MAIN;
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
                  gap: 30,
                  opacity: dim * (0.3 + 0.7 * Math.min(1, t)) * (main ? 1 : 1 - 0.65 * focus),
                  transform: `scale(${(0.96 + 0.04 * Math.min(1, t)) * (main ? 1 + 0.06 * focus : 1)})`,
                }}
              >
                <Icon kind={c.kind} />
                <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 40, color: INK[900], letterSpacing: '-0.01em' }}>{c.label}</div>
              </div>
            );
          })}
        </div>
      </WindowFrame>
      {/* kolo 50: nadpis kroku hore vlavo (predtym vpravo s nazvom fazy a riadkom) */}
      <StepLabel frame={frame} steps={[{ from: 700, title: 'Práca s databázou' }]} opacity={1 - tw(7900, 300)} />
    </Scene>
  );
};
