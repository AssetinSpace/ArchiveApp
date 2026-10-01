import React from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion';
import { WindowFrame } from '../components/Device';
import { Step } from '../components/Steps';
import { APP_WIN, FootView, StepLabel, WIN_CHROME, autoViews, footViewAt } from '../components/Frame16';
import { PANEL, ValueCard } from '../components/AppCards';
import type { Rect } from '../components/Device';
import { cutDuration, cutTime, srcFrac } from '../lib/cuts';
import { voAt } from '../components/Subtitles';
import { settle, tween } from '../lib/anim';
import { loadFonts } from '../lib/fonts';
import { BRAND } from '../theme';

/**
 * Desktop footage (screen recording z prehliadaca) v okne aplikacie (do kola 49 vlavo v FOOTAGE_WINDOW a vpravo
 * sprievodne kroky, od kola 50 okno APP_WIN na celu sirku a nadpis kroku hore vlavo). Zaznam je orezany o listu prehliadaca a bocny
 * panel appky (1520 x 882), skaluje sa presne na obsah okna.
 * Kolo 33: `win` = ine okno (FOOTAGE_WINDOW_WIDE pre nove zaznamy F3/F4 s pomerom 2:1, bez orezania obsahu),
 * zvyraznenia maju farbu (zelena = potvrdenie, jantarova = oprava) alebo rámik (`outline`).
 * Kolo 35: `spot` = ramik a stmavene okolie (zelena fixka v F3 nebola dost vidiet), spoty sa v case neprekryvaju.
 * Kolo 36: spot vsade (F1, F3, F4), ramik spotu ma farbu podla `color` (jantarova = oprava).
 * Zdroj: public/footage/ (priecinok nie je v gite).
 */
const MARK_FILL = { green: 'rgba(79,168,90,0.28)', amber: 'rgba(245,158,11,0.34)' };
export const SRC_WIDE = { w: 1764, h: 882 }; // F3, F4 po oreze
export const SRC_F2 = { w: 1520, h: 882 };
export type Tap = { t: number; x: number; y: number; d?: number; lead?: number }; // s, podiel sirky/vysky obsahu okna; kolo 53: d = trvanie kruzku (ms), lead = o kolko s skor zacne (kruzok nesmie prejst cez strih)
/** Kolo 52: karta pod oknom (s klipu); `node` je karta z components/AppCards. */
export type Panel = { from: number; to: number; node: React.ReactNode };
export type Mark = { from: number; to: number; x: number; y: number; w: number; h: number; sweep?: number; color?: 'green' | 'amber'; outline?: boolean; spot?: boolean; pad?: number }; // pad = okraj spotu okolo oblasti (px, predvolene 8) // s, podiely obsahu okna; sweep = s, za ktore sa zvyraznenie "nakresli" zlava (ako fixkou)

/**
 * Kolo 50 (Samuel: ramec obrazu z kratkej LinkedIn verzie na 16:9): zaznam je v jednom okne na celu sirku ramca
 * (APP_WIN, zarovnane s nadpisom a logom v rohu), nadpis kroku hore vlavo (StepLabel, bez nazvu fazy a bodiek).
 * Zaznam je v okne priblizeny na vyrez zdroja, ktory sa v case posuva (`views`, px zdroja); bez `views` celkovy pohlad
 * a priblizenie na kazde zvyraznenie (autoViews). Zvyraznenia (spot) a kliky su v podieloch zdroja, kreslia sa v px okna.
 * `src` = rozmer zdroja po oreze (F2 1520 x 882, F3 a F4 1764 x 882).
 */
/**
 * Kolo 52 (Samuel: preniest do dlhej aj karty kratkej verzie): `panels` = karty pod oknom (navrh udajov, hladane slovo,
 * najdena polozka, cesta k polozke). Pocas karty sa okno plynulo zmensi o pas PANEL.h + PANEL.gap (spodok okna 660 px),
 * karta je pod nim (680 az 880 px); karty, ktore idu hned po sebe, zdielaju jeden pas. Vyrezy (autoViews) su pocitane
 * pre mensie okno, zvyraznenie je tak cele vidno v oboch velkostiach (vo vacsom okne je pod nim viac zaznamu).
 */
const PANEL_IN = 450;
const panelZones = (panels: Panel[]) => {
  const zs: { from: number; to: number }[] = [];
  [...panels].sort((a, b) => a.from - b.from).forEach((p) => {
    const z = zs[zs.length - 1];
    if (z && p.from - z.to < 0.6) z.to = Math.max(z.to, p.to);
    else zs.push({ from: p.from, to: p.to });
  });
  return zs;
};
export const DesktopFootageClip: React.FC<{ src: string; seconds: number; steps: Step[]; taps?: Tap[]; marks?: Mark[]; enter?: boolean; size?: { w: number; h: number }; views?: FootView[]; overviewY?: number; fadeOut?: boolean; panels?: Panel[] }> = ({ src, seconds, steps, taps = [], marks = [], enter = false, size = SRC_WIDE, views, overviewY, fadeOut: fade = true, panels = [] }) => {
  const frame = useCurrentFrame();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const winIn = enter ? tw(0, 400) : 1; // okno sa objavi z bielej (ked predchadzajuca scena nekonci oknom)
  const screenIn = tw(enter ? 300 : 0, 300); // obsah okna: z bielej do zaznamu
  const fadeOut = fade ? tw(seconds * 1000 - 500, 400) : 0;
  const textIn = settle(frame, enter ? 500 : 300);
  React.useEffect(() => {
    loadFonts();
  }, []);
  const zones = React.useMemo(() => panelZones(panels), [panels]);
  const shrink = zones.reduce((a, z) => Math.max(a, tw(z.from * 1000 - 100, PANEL_IN) * (1 - tw(z.to * 1000 - 150, PANEL_IN))), 0);
  const cut = PANEL.h + PANEL.gap;
  const win: Rect = { ...APP_WIN, h: APP_WIN.h - cut * shrink };
  const cw = win.w,
    ch = win.h - WIN_CHROME,
    chMin = APP_WIN.h - WIN_CHROME - (panels.length ? cut : 0);
  const keys = React.useMemo(() => views ?? autoViews(marks.filter((m) => m.spot), size, chMin / cw, { overviewY }), [views, marks, size, chMin, cw, overviewY]);
  const v = footViewAt(keys, frame / 30);
  const k = cw / v.w; // px okna na px zdroja
  const X = (fx: number) => (fx * size.w - v.x) * k,
    Y = (fy: number) => (fy * size.h - v.y) * k;
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: winIn, transform: `scale(${0.94 + 0.06 * winIn})`, transformOrigin: `${win.x + cw / 2}px ${win.y + win.h / 2}px` }}>
        <WindowFrame at={win}>
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#fff' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: size.w, height: size.h, transformOrigin: '0 0', transform: `translate(${-v.x * k}px, ${-v.y * k}px) scale(${k})` }}>
              <OffthreadVideo src={staticFile(src)} muted style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
            </div>
            {/* zvyraznenie: spot (ramik + stmavene okolie), ramik alebo fixka; v px okna, ramik ma stale rovnaku hrubku */}
            {marks.map((m, i) => {
              const a = tw(m.from * 1000, 200) * (1 - tw(m.to * 1000 - 250, 250));
              if (a <= 0) return null;
              const left = X(m.x),
                top = Y(m.y),
                w = m.w * size.w * k,
                h = m.h * size.h * k;
              if (m.spot) {
                const p = (m.pad ?? 8) * Math.min(1.5, k);
                return <div key={`m${i}`} style={{ position: 'absolute', left: left - p, top: top - p, width: w + 2 * p, height: h + 2 * p, borderRadius: 10, border: `4px solid ${m.color === 'amber' ? '#F59E0B' : BRAND[400]}`, boxShadow: `0 0 0 4000px rgba(15,23,42,${0.38 * a})`, opacity: Math.min(1, a * 1.5), transform: `scale(${1.02 - 0.02 * a})`, pointerEvents: 'none' }} />;
              }
              if (m.outline) {
                return <div key={`m${i}`} style={{ position: 'absolute', left: left - 6, top: top - 6, width: w + 12, height: h + 12, borderRadius: 8, border: `4px solid ${BRAND[400]}`, boxShadow: '0 0 0 6px rgba(79,168,90,0.18)', opacity: a, transform: `scale(${1.03 - 0.03 * a})`, pointerEvents: 'none' }} />;
              }
              const sweep = m.sweep ? tw(m.from * 1000, m.sweep * 1000) : 1;
              return <div key={`m${i}`} style={{ position: 'absolute', left: left - 4, top, width: (w + 8) * sweep, height: h, borderRadius: 4, background: MARK_FILL[m.color ?? 'green'], opacity: a, pointerEvents: 'none', mixBlendMode: 'multiply' }} />;
            })}
            {/* kliky: jemny zeleny kruh ako pri mobilnom footage */}
            {taps.map((tp, i) => {
              const t = tw((tp.t - (tp.lead ?? 0.1)) * 1000, tp.d ?? 550);
              if (t <= 0 || t >= 1) return null;
              const r = 18 + 66 * t;
              return <div key={`t${i}`} style={{ position: 'absolute', left: X(tp.x) - r, top: Y(tp.y) - r, width: 2 * r, height: 2 * r, borderRadius: '50%', border: `3px solid ${BRAND[400]}`, background: `rgba(79,168,90,${0.28 * (1 - t)})`, opacity: 1 - t * t, pointerEvents: 'none' }} />;
            })}
            <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 1 - screenIn, pointerEvents: 'none' }} />
          </div>
        </WindowFrame>
      </div>
      {panels.map((p, i) => {
        const a = tw(p.from * 1000 + 120, 350) * (1 - tw(p.to * 1000 - 250, 250)) * winIn; // kolo 52: karta od zaciatku (F4) nabehne s oknom
        if (a <= 0) return null;
        return (
          <div key={`p${i}`} style={{ position: 'absolute', left: APP_WIN.x, top: APP_WIN.y + APP_WIN.h - PANEL.h, width: APP_WIN.w, height: PANEL.h, opacity: a, transform: `translateY(${(1 - a) * 24}px)` }}>
            {p.node}
          </div>
        );
      })}
      <StepLabel frame={frame} steps={steps} opacity={textIn} />
      <AbsoluteFill style={{ background: '#fff', opacity: fadeOut, pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};

/** Klik v px zdroja (pred orezom) -> Tap. */
export const tapAt = (id: string, src: number, x: number, y: number): Tap => {
  const f = srcFrac(id, x, y);
  return { t: cutTime(id, src), x: f.x, y: f.y };
};
/** Zvyraznenie v px zdroja (pred orezom), casy v s zostrihu. */
export const markAt = (id: string, from: number, to: number, x: number, y: number, w: number, h: number, opts: Partial<Mark> = {}): Mark => ({ from, to, ...srcFrac(id, x, y, w, h), ...opts });

/**
 * F2 - Extrakcia metadat: zostrih podla src/footage/cuts.json (f2-metadata), casy
 * krokov a klikov sa pocitaju z casu zdroja. Kolo 33: hlas od 0,4 s, kliky premerane
 * (zaskrtnutie 11,3 s, Extrahovat metadata 13,5 s, spustenie 16,6 s), spracovanie
 * zrychlene (10 -> 60 % 6x, cakanie na 60 % vystrihnute, 60 -> 100 % 1,5x), prelinacky medzi strihmi.
 */
export const F2_SECONDS = cutDuration('f2-metadata');
const F2_STEPS: Step[] = [
  { from: 0, title: 'Prečítať text' }, // kolo 51: nazvy krokov ako v kratkej verzii
  { from: voAt('F2-Metadata', 0, 1), title: 'Návrh údajov' },
];
/** Kolo 53: kruzky kratsie, aby neprechadzali cez prelinacku do dalsieho useku zostrihu. */
const F2_TAPS: Tap[] = [
  { ...tapAt('f2-metadata', 11.3, 546, 972), d: 400 }, // vyber prilohy (checkbox)
  { ...tapAt('f2-metadata', 13.5, 1606, 972), d: 350 }, // Extrahovat metadata (dalsi usek od 1,1 s)
  tapAt('f2-metadata', 16.6, 1680, 976), // spustit (sipka pri sablone)
];
/**
 * Kolo 50: vyrez nizsie (fotka a priebeh spracovania, nie nadpis Archiv PD). Kolo 52: kym nie je karta, cely spodok
 * zaznamu (prilohy a kliky); s kartou (okno mensie) vyrez na fotku a priebeh spracovania.
 */
const F2_VIEWS: FootView[] = [
  { t: 0, x: 0, y: 242, w: SRC_F2.w },
  { t: voAt('F2-Metadata', 0, 1) / 1000 - 0.1, x: 0, y: 242, w: SRC_F2.w },
  { t: voAt('F2-Metadata', 0, 1) / 1000 + 0.5, x: 0, y: 400, w: SRC_F2.w },
];
/**
 * Kolo 52: pri "a navrhne udaje" karta navrhu pod oknom ako v kratkej verzii (Nazov projektu, autor a rok pri svojich
 * slovach, slova z public/vo/lines/F2-Metadata-0.words.json); ostava az do konca klipu (F4 zacina s tou istou kartou).
 */
const F2_W = { autora: 6.32, rok: 7.24 };
const f2s = (w: number) => (voAt('F2-Metadata', 0) + w * 1000) / 1000;
const F2_PANELS: Panel[] = [{ from: voAt('F2-Metadata', 0, 1) / 1000, to: F2_SECONDS + 1, node: <ValueCard authorAt={f2s(F2_W.autora) - 0.1} yearAt={Math.min(f2s(F2_W.rok) - 0.1, 7.38)} /> }];
export const F2_Metadata: React.FC = () => <DesktopFootageClip src="footage/f2-metadata.mp4" seconds={F2_SECONDS} steps={F2_STEPS} taps={F2_TAPS} size={SRC_F2} views={F2_VIEWS} panels={F2_PANELS} />;
