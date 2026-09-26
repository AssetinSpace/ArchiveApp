import React from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion';
import { FOOTAGE_WINDOW, Rect, WindowFrame } from '../components/Device';
import { Step, StepsPanel } from '../components/Steps';
import { phases } from '../copy/sk';
import { cutDuration, cutTime, srcFrac } from '../lib/cuts';
import { voAt } from '../components/Subtitles';
import { settle, tween } from '../lib/anim';
import { loadFonts } from '../lib/fonts';
import { BRAND } from '../theme';

/**
 * Desktop footage (screen recording z prehliadaca) v okne aplikacie vlavo
 * (FOOTAGE_WINDOW, rovnake okno, do ktoreho dosla predchadzajuca scena),
 * vpravo sprievodne kroky. Zaznam je orezany o listu prehliadaca a bocny
 * panel appky (1520 x 882), skaluje sa presne na obsah okna.
 * Kolo 33: `win` = ine okno (FOOTAGE_WINDOW_WIDE pre nove zaznamy F3/F4 s pomerom 2:1, bez orezania obsahu),
 * zvyraznenia maju farbu (zelena = potvrdenie, jantarova = oprava) alebo rámik (`outline`).
 * Kolo 35: `spot` = ramik a stmavene okolie (zelena fixka v F3 nebola dost vidiet), spoty sa v case neprekryvaju.
 * Kolo 36: spot vsade (F1, F3, F4), ramik spotu ma farbu podla `color` (jantarova = oprava).
 * Zdroj: public/footage/ (priecinok nie je v gite).
 */
export type Tap = { t: number; x: number; y: number }; // s, podiel sirky/vysky obsahu okna
export type Mark = { from: number; to: number; x: number; y: number; w: number; h: number; sweep?: number; color?: 'green' | 'amber'; outline?: boolean; spot?: boolean }; // s, podiely obsahu okna; sweep = s, za ktore sa zvyraznenie "nakresli" zlava (ako fixkou)

const MARK_FILL = { green: 'rgba(79,168,90,0.28)', amber: 'rgba(245,158,11,0.34)' };

export const DesktopFootageClip: React.FC<{ src: string; seconds: number; steps: Step[]; phase?: string; taps?: Tap[]; marks?: Mark[]; enter?: boolean; win?: Rect; panelLeft?: number; panelWidth?: number }> = ({ src, seconds, steps, phase = phases.app, taps = [], marks = [], enter = false, win = FOOTAGE_WINDOW, panelLeft, panelWidth }) => {
  const frame = useCurrentFrame();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const winIn = enter ? tw(0, 400) : 1; // okno sa objavi z bielej (ked predchadzajuca scena nekonci oknom)
  const screenIn = tw(enter ? 300 : 0, 300); // obsah okna: z bielej do zaznamu
  const fadeOut = tw(seconds * 1000 - 500, 400);
  const textIn = settle(frame, enter ? 500 : 300);
  React.useEffect(() => {
    loadFonts();
  }, []);
  const cw = win.w,
    ch = win.h - 44;
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: winIn, transform: `scale(${0.94 + 0.06 * winIn})`, transformOrigin: `${win.x + cw / 2}px ${win.y + win.h / 2}px` }}>
        <WindowFrame at={win}>
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#fff' }}>
            <OffthreadVideo src={staticFile(src)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {/* zvyraznenie ako fixkou (polopriehladna plocha, nakresli sa zlava doprava) alebo ramik */}
            {marks.map((m, i) => {
              const a = tw(m.from * 1000, 200) * (1 - tw(m.to * 1000 - 250, 250));
              if (a <= 0) return null;
              if (m.spot) {
                return <div key={`m${i}`} style={{ position: 'absolute', left: m.x * cw - 8, top: m.y * ch - 8, width: m.w * cw + 16, height: m.h * ch + 16, borderRadius: 10, border: `4px solid ${m.color === 'amber' ? '#F59E0B' : BRAND[400]}`, boxShadow: `0 0 0 4000px rgba(15,23,42,${0.38 * a})`, opacity: Math.min(1, a * 1.5), transform: `scale(${1.02 - 0.02 * a})`, pointerEvents: 'none' }} />;
              }
              if (m.outline) {
                return <div key={`m${i}`} style={{ position: 'absolute', left: m.x * cw - 6, top: m.y * ch - 6, width: m.w * cw + 12, height: m.h * ch + 12, borderRadius: 8, border: `4px solid ${BRAND[400]}`, boxShadow: '0 0 0 6px rgba(79,168,90,0.18)', opacity: a, transform: `scale(${1.03 - 0.03 * a})`, pointerEvents: 'none' }} />;
              }
              const sweep = m.sweep ? tw(m.from * 1000, m.sweep * 1000) : 1;
              return <div key={`m${i}`} style={{ position: 'absolute', left: m.x * cw - 4, top: m.y * ch, width: (m.w * cw + 8) * sweep, height: m.h * ch, borderRadius: 4, background: MARK_FILL[m.color ?? 'green'], opacity: a, pointerEvents: 'none', mixBlendMode: 'multiply' }} />;
            })}
            {/* kliky: jemny zeleny kruh ako pri mobilnom footage */}
            {taps.map((tp, i) => {
              const t = tw(tp.t * 1000, 550);
              if (t <= 0 || t >= 1) return null;
              const r = 16 + 60 * t;
              return <div key={`t${i}`} style={{ position: 'absolute', left: tp.x * cw - r, top: tp.y * ch - r, width: 2 * r, height: 2 * r, borderRadius: '50%', border: `3px solid ${BRAND[400]}`, background: `rgba(79,168,90,${0.28 * (1 - t)})`, opacity: 1 - t * t, pointerEvents: 'none' }} />;
            })}
            <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 1 - screenIn, pointerEvents: 'none' }} />
          </div>
        </WindowFrame>
      </div>
      <StepsPanel frame={frame} steps={steps} phase={phase} opacity={textIn} left={panelLeft} width={panelWidth} />
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
  { from: 0, title: 'Rozpoznať text' },
  { from: voAt('F2-Metadata', 0, 1), title: 'Navrhnúť metadáta' },
];
const F2_TAPS: Tap[] = [
  tapAt('f2-metadata', 11.3, 546, 972), // vyber prilohy (checkbox)
  tapAt('f2-metadata', 13.5, 1606, 972), // Extrahovat metadata
  tapAt('f2-metadata', 16.6, 1680, 976), // spustit (sipka pri sablone)
];
export const F2_Metadata: React.FC = () => <DesktopFootageClip src="footage/f2-metadata.mp4" seconds={F2_SECONDS} steps={F2_STEPS} taps={F2_TAPS} />;
