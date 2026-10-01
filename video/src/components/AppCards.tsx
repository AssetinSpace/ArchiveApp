import React from 'react';
import { useCurrentFrame } from 'remotion';
import { APP_WIN } from './Frame16';
import { HIcon, HKind } from './ArchivesIcons';
import { pop, settle, tween } from '../lib/anim';
import { BRAND, FONT, FPS, INK } from '../theme';

/**
 * Karty pod oknom aplikacie (kolo 52, Samuel: preniest do dlhej aj zvysok obrazu kratkej verzie). Prekreslene detaily
 * zaznamu ako v kratkej LinkedIn verzii (ValueField, SearchField, ItemCard, DocPath v scenes/kratka/LinkedIn.tsx),
 * rozlozene na sirku okna 16:9 (APP_WIN.w) a do pasu vysokeho PANEL.h pod oknom; okno sa pocas karty zmensi
 * (DesktopFootageClip `panels`). Casy su v s klipu (F3, F4 bez pauz; F2 ma kartu az po hlase, pauza na konci).
 */
export const PANEL = { h: 200, gap: 20 };
const W = APP_WIN.w;
const APP_FONT = FONT.body; // aplikacia Assetin Archives pouziva Inter
const BOX: React.CSSProperties = { position: 'relative', boxSizing: 'border-box', borderRadius: 16, overflow: 'hidden', border: `3px solid ${BRAND[400]}`, boxShadow: '0 14px 36px rgba(15,23,42,0.12)', background: '#fff' };
const sec = (frame: number) => frame / FPS;

/**
 * Navrh aplikacie (Nazov projektu), autor a rok pri svojich slovach, pri potvrdeni (klik v zazname) zelena karta
 * s velkou fajkou a stitkom "Potvrdene". Hodnoty zo zaznamu aplikacie ako v kratkej verzii.
 */
export const ValueCard: React.FC<{ approveAt?: number; authorAt: number; yearAt: number }> = ({ approveAt = 1e9, authorAt, yearAt }) => {
  const frame = useCurrentFrame();
  const ok = settle(frame, approveAt * 1000);
  const tick = pop(frame, approveAt * 1000 + 80);
  const au = settle(frame, authorAt * 1000);
  const yr = settle(frame, yearAt * 1000);
  const green = ok > 0.5;
  const meta = (t: number, label: string, value: string) => (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 14, opacity: t, transform: `translateY(${(1 - t) * 10}px)` }}>
      <span style={{ fontFamily: APP_FONT, fontWeight: 500, fontSize: 28, color: INK[500] }}>{label}</span>
      <span style={{ fontFamily: APP_FONT, fontWeight: 700, fontSize: 32, color: INK[900], whiteSpace: 'nowrap' }}>{value}</span>
    </span>
  );
  return (
    <div style={{ ...BOX, width: W, height: PANEL.h, padding: '20px 160px 0 44px', background: ok > 0 ? `rgba(234,245,235,${ok})` : '#fff', border: `3px solid ${green ? BRAND[500] : BRAND[400]}`, boxShadow: ok > 0 ? `0 0 0 ${3 * ok}px ${BRAND[400]}, 0 14px 36px rgba(31,122,51,${0.18 * ok})` : BOX.boxShadow }}>
      <div style={{ position: 'absolute', right: 44, top: (PANEL.h - 6 - 92) / 2, width: 92, height: 92, borderRadius: 46, background: BRAND[500], display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: Math.min(1, tick * 1.4), transform: `scale(${0.4 + 0.6 * tick})`, boxShadow: '0 8px 20px rgba(31,122,51,0.3)' }}>
        <svg width={54} height={54} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5 L10 17 L19 7" />
        </svg>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: 40 }}>
        <div style={{ fontFamily: APP_FONT, fontWeight: 500, fontSize: 29, color: green ? BRAND[700] : INK[500] }}>Názov projektu</div>
        <div style={{ display: 'flex', alignItems: 'center', height: 38, padding: '0 16px', borderRadius: 19, background: BRAND[500], fontFamily: APP_FONT, fontWeight: 700, fontSize: 23, color: '#fff', opacity: ok, transform: `scale(${0.85 + 0.15 * ok})` }}>Potvrdené</div>
      </div>
      <div style={{ marginTop: 6, fontFamily: APP_FONT, fontWeight: 700, fontSize: 50, lineHeight: 1.12, letterSpacing: '-0.01em', color: INK[900], whiteSpace: 'nowrap' }}>Novostavba bytového domu SLNEČNÁ 12, BRATISLAVA</div>
      <div style={{ marginTop: 14, display: 'flex', gap: 56 }}>
        {meta(au, 'Autor', 'DOMINIS PROJEKT, s.r.o.')}
        {meta(yr, 'Rok', '2018')}
      </div>
    </div>
  );
};

/** Pole vyhladavania ako v aplikacii (ikona ?, zeleny okraj), slovo "vodovod" sa pise v case ako v zazname. */
const SEARCH_WORD = 'vodovod';
export const SearchCard: React.FC<{ typeFrom: number; typeTo: number }> = ({ typeFrom, typeTo }) => {
  const frame = useCurrentFrame();
  const s = sec(frame);
  const n = s < typeFrom ? 0 : Math.min(SEARCH_WORD.length, 1 + Math.floor(((s - typeFrom) / (typeTo - typeFrom)) * SEARCH_WORD.length));
  const caret = (s >= typeFrom - 0.3 && s <= typeTo + 0.2) || Math.floor(s * 2.2) % 2 === 0;
  return (
    <div style={{ ...BOX, width: W, height: 150, display: 'flex', alignItems: 'stretch' }}>
      <div style={{ width: 130, flex: 'none', borderRight: `2px solid ${INK[200]}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={50} height={50} viewBox="0 0 24 24" fill="none" stroke={INK[700]} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx={12} cy={12} r={9.5} />
          <path d="M9.4 9.3 a2.7 2.7 0 1 1 3.6 2.6 c-0.7 0.3 -1 0.8 -1 1.5 v0.4" />
          <circle cx={12} cy={17} r={0.6} fill={INK[700]} />
        </svg>
      </div>
      <div style={{ flex: 1, margin: 18, border: `3px solid ${BRAND[500]}`, borderRadius: 10, display: 'flex', alignItems: 'center', padding: '0 28px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {n > 0 ? <span style={{ fontFamily: APP_FONT, fontWeight: 500, fontSize: 56, color: INK[900] }}>{SEARCH_WORD.slice(0, n)}</span> : null}
        <span style={{ display: 'inline-block', flex: 'none', width: 3, height: 50, margin: n > 0 ? '0 0 0 3px' : '0 6px 0 0', background: INK[900], opacity: caret ? 1 : 0 }} />
        {n > 0 ? null : <span style={{ fontFamily: APP_FONT, fontSize: 32, color: INK[400] }}>Časti slov, "presné slová" alebo frázy</span>}
      </div>
    </div>
  );
};

/** Stitok ako v aplikacii: zeleny typ polozky, zlte "najdene v". */
const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', height: 42, padding: '0 16px', borderRadius: 9, fontFamily: APP_FONT, fontWeight: 600, fontSize: 26, background: BRAND[50], border: `2px solid ${BRAND[300]}`, color: BRAND[700] }}>{children}</span>
);
/**
 * Najdena polozka (vysledok hladania "vodovod"): zlozka ZL_03 podla titulnej strany na fotke a riadok, v ktorom sa
 * slovo naslo, "vodovod" zvyraznene ako v aplikacii (ako ItemCard v kratkej verzii, na sirku v dvoch riadkoch).
 */
const HIT_TEXT = ['Doplnenie ', 'vodovod', 'nej prípojky podľa požiadavky investora'] as const;
export const ItemCard: React.FC = () => (
  <div style={{ ...BOX, width: W, height: PANEL.h, padding: '22px 40px 0 40px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <HIcon kind="folder" size={60} on />
      <span style={{ fontFamily: APP_FONT, fontWeight: 700, fontSize: 40, lineHeight: 1, color: INK[900] }}>ZL_03</span>
      <Chip>Zložka</Chip>
      <span style={{ marginLeft: 14, fontFamily: APP_FONT, fontWeight: 700, fontSize: 36, color: INK[900], whiteSpace: 'nowrap' }}>Novostavba bytového domu SLNEČNÁ 12, BRATISLAVA</span>
    </div>
    <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 24 }}>
      <div style={{ padding: '10px 18px', borderRadius: 10, background: '#FFFBEB', border: '2px solid #F2C94C', fontFamily: APP_FONT, fontSize: 30, lineHeight: 1.25, color: INK[700], whiteSpace: 'nowrap' }}>
        {HIT_TEXT[0]}
        <span style={{ background: '#FDE68A', borderRadius: 4, padding: '0 3px', fontWeight: 700, color: INK[900] }}>{HIT_TEXT[1]}</span>
        {HIT_TEXT[2]}
      </div>
      <span style={{ marginLeft: 'auto', fontFamily: APP_FONT, fontSize: 26, color: INK[500], whiteSpace: 'nowrap' }}>Projekt pre stavebné povolenie · 05/2018</span>
    </div>
  </div>
);

/**
 * Cesta k polozke Polica PL_01 -> Krabica KR_01 -> Zlozka ZL_03 (drobcek z aplikacie) pri "aj cestu k nej": ikony sa
 * rozsvietia pri svojich slovach, sipky medzi nimi sa vyplnia. `lineAt` = s klipu, kde zacina veta "aj cestu k nej.".
 */
const PATH_WORDS = { cestu: 0.26, k: 0.6, nej: 0.66 }; // s od zaciatku vety (ta ista nahravka ako v kratkej verzii)
const PATH_STEPS: { kind: HKind; label: string; code: string; at: number }[] = [
  { kind: 'shelf', label: 'Polica', code: 'PL_01', at: PATH_WORDS.cestu - 0.06 },
  { kind: 'box', label: 'Krabica', code: 'KR_01', at: PATH_WORDS.k - 0.1 },
  { kind: 'folder', label: 'Zložka', code: 'ZL_03', at: PATH_WORDS.nej + 0.06 },
];
export const DocPath: React.FC<{ lineAt: number }> = ({ lineAt }) => {
  const frame = useCurrentFrame();
  const s = sec(frame);
  const C = 104,
    col = 420,
    x0 = (W - col * PATH_STEPS.length) / 2;
  return (
    <div style={{ position: 'relative', width: W, height: PANEL.h }}>
      {PATH_STEPS.slice(1).map((st, i) => {
        const t = tween(frame, (lineAt + st.at) * 1000 - 250, 250);
        const a = x0 + col * i + col / 2 + C / 2 + 14,
          b = x0 + col * (i + 1) + col / 2 - C / 2 - 14;
        return (
          <div key={st.label} style={{ position: 'absolute', left: a, top: C / 2 - 2, width: b - a, height: 4, borderRadius: 2, background: INK[200] }}>
            <div style={{ width: `${t * 100}%`, height: '100%', borderRadius: 2, background: BRAND[500] }} />
            <svg width={18} height={22} viewBox="0 0 18 22" style={{ position: 'absolute', right: -6, top: -9 }}>
              <path d="M3 3 L13 11 L3 19" fill="none" stroke={t > 0.95 ? BRAND[500] : INK[300]} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        );
      })}
      {PATH_STEPS.map((st, i) => {
        const on = s >= lineAt + st.at;
        const lit = settle(frame, (lineAt + st.at) * 1000);
        return (
          <div key={st.label} style={{ position: 'absolute', left: x0 + col * i, top: 0, width: col, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ transform: `scale(${1 + 0.08 * lit * (1 - tween(frame, (lineAt + st.at) * 1000 + 250, 300))})` }}>
              <HIcon kind={st.kind} size={C} on={on} />
            </div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 14 }}>
              <span style={{ fontFamily: APP_FONT, fontWeight: 700, fontSize: 36, color: on ? BRAND[700] : INK[500] }}>{st.code}</span>
              <span style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 30, color: on ? INK[900] : INK[400] }}>{st.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
