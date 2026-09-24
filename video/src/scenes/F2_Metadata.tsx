import React from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion';
import { FOOTAGE_WINDOW, WindowFrame } from '../components/Device';
import { Step, StepsPanel } from '../components/Steps';
import { phases } from '../copy/sk';
import { cutDuration, cutTime, segStart } from '../lib/cuts';
import { settle, tween } from '../lib/anim';
import { loadFonts } from '../lib/fonts';
import { BRAND } from '../theme';

/**
 * Desktop footage (screen recording z prehliadaca) v okne aplikacie vlavo
 * (FOOTAGE_WINDOW, rovnake okno, do ktoreho dosla predchadzajuca scena),
 * vpravo sprievodne kroky. Zaznam je orezany o listu prehliadaca a bocny
 * panel appky (1520 x 882), skaluje sa presne na obsah okna.
 * Zdroj: public/footage/ (priecinok nie je v gite).
 */
export type Tap = { t: number; x: number; y: number }; // s, podiel sirky/vysky obsahu okna
export type Mark = { from: number; to: number; x: number; y: number; w: number; h: number; sweep?: number }; // s, podiely obsahu okna; sweep = s, za ktore sa zvyraznenie "nakresli" zlava (ako fixkou)

export const DesktopFootageClip: React.FC<{ src: string; seconds: number; steps: Step[]; phase?: string; taps?: Tap[]; marks?: Mark[]; enter?: boolean }> = ({ src, seconds, steps, phase = phases.app, taps = [], marks = [], enter = false }) => {
  const frame = useCurrentFrame();
  const ms = (frame / 30) * 1000;
  const tw = (s: number, d: number) => tween(frame, s, d);
  const winIn = enter ? tw(0, 400) : 1; // okno sa objavi z bielej (ked predchadzajuca scena nekonci oknom)
  const screenIn = tw(enter ? 300 : 0, 300); // obsah okna: z bielej do zaznamu
  const fadeOut = tw(seconds * 1000 - 500, 400);
  const textIn = settle(frame, enter ? 500 : 300);
  React.useEffect(() => {
    loadFonts();
  }, []);
  const cw = FOOTAGE_WINDOW.w,
    ch = FOOTAGE_WINDOW.h - 44;
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: winIn, transform: `scale(${0.94 + 0.06 * winIn})`, transformOrigin: `${FOOTAGE_WINDOW.x + cw / 2}px ${FOOTAGE_WINDOW.y + FOOTAGE_WINDOW.h / 2}px` }}>
        <WindowFrame at={FOOTAGE_WINDOW}>
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#fff' }}>
            <OffthreadVideo src={staticFile(src)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {/* jemne zvyraznenie textu ako fixkou: polopriehladna zelena plocha, nakresli sa zlava doprava */}
            {marks.map((m, i) => {
              const a = tw(m.from * 1000, 200) * (1 - tw(m.to * 1000 - 250, 250));
              if (a <= 0) return null;
              const sweep = m.sweep ? tw(m.from * 1000, m.sweep * 1000) : 1;
              return <div key={`m${i}`} style={{ position: 'absolute', left: m.x * cw - 4, top: m.y * ch, width: (m.w * cw + 8) * sweep, height: m.h * ch, borderRadius: 4, background: 'rgba(79,168,90,0.28)', opacity: a, pointerEvents: 'none', mixBlendMode: 'multiply' }} />;
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
      <StepsPanel frame={frame} steps={steps} phase={phase} opacity={textIn} />
      <AbsoluteFill style={{ background: '#fff', opacity: fadeOut, pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};

/**
 * F2 - Extrakcia metadat: zostrih podla src/footage/cuts.json (f2-metadata), casy
 * krokov a klikov sa pocitaju z casu zdroja. Kolo 29: kazdy krok zacina zmrazenym
 * obrazom (pauza, citanie, dej), kliky 1x.
 */
export const F2_SECONDS = cutDuration('f2-metadata');
const F2_STEPS: Step[] = [
  { from: 0, title: 'Príloha čaká' },
  { from: segStart('f2-metadata', 1) * 1000, title: 'Extrahovať metadáta' },
];
const F2_TAPS: Tap[] = [
  { t: cutTime('f2-metadata', 14.3), x: 0.099, y: 0.93 }, // vyber prilohy (checkbox)
  { t: cutTime('f2-metadata', 14.8), x: 0.75, y: 0.94 }, // Extrahovat metadata
  { t: cutTime('f2-metadata', 15.8), x: 0.81, y: 0.93 }, // potvrdit sablonu
  { t: cutTime('f2-metadata', 16.8), x: 0.842, y: 0.937 }, // spustit
];
export const F2_Metadata: React.FC = () => <DesktopFootageClip src="footage/f2-metadata.mp4" seconds={F2_SECONDS} steps={F2_STEPS} taps={F2_TAPS} />;
