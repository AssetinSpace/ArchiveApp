import React from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion';
import { FOOTAGE_WINDOW, WindowFrame } from '../components/Device';
import { Step, StepsPanel } from '../components/Steps';
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
export type Mark = { from: number; to: number; x: number; y: number; w: number; h: number }; // s, podiely obsahu okna

export const DesktopFootageClip: React.FC<{ src: string; seconds: number; steps: Step[]; taps?: Tap[]; marks?: Mark[]; enter?: boolean }> = ({ src, seconds, steps, taps = [], marks = [], enter = false }) => {
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
            {/* zvyraznenie oblasti (napr. pole vyhladavania, spravna hodnota): zeleny ramik s jemnym podfarbenim */}
            {marks.map((m, i) => {
              const a = tw(m.from * 1000, 250) * (1 - tw(m.to * 1000 - 250, 250));
              if (a <= 0) return null;
              return <div key={`m${i}`} style={{ position: 'absolute', left: m.x * cw - 6, top: m.y * ch - 6, width: m.w * cw + 12, height: m.h * ch + 12, borderRadius: 8, border: `3px solid ${BRAND[500]}`, background: 'rgba(79,168,90,0.10)', boxShadow: '0 0 0 4px rgba(79,168,90,0.18)', opacity: a, pointerEvents: 'none' }} />;
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
      <StepsPanel frame={frame} steps={steps} opacity={textIn} />
      <AbsoluteFill style={{ background: '#fff', opacity: fadeOut, pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};

/**
 * F2 - Extrakcia metadat (36 s zaznam zostrihany na 8,3 s): prehlad priloh
 * (3,0-3,8 s) + vyber prilohy, "Extrahovat metadata" a potvrdenie (14-17 s),
 * stranka Kontroly s nahladom a priebehom (18-21 s, 21-23,5 s 1,7x). Kliky zvyraznene.
 */
export const F2_SECONDS = 8.3;
const F2_STEPS: Step[] = [
  { from: 0, title: 'Príloha čaká', line: 'Fotka štítku je pri zložke ZL_01, pripravená na extrakciu.' },
  { from: 1000, title: 'Extrahovať metadáta', line: 'Jeden klik. Údaje sa čítajú z fotky.' },
  { from: 3800, title: 'Návrh na kontrolu', line: 'Aplikácia rozpozná text a navrhne metadáta. Platné sú až po kontrole človekom.' },
];
const F2_TAPS: Tap[] = [
  { t: 1.1, x: 0.099, y: 0.93 }, // vyber prilohy (checkbox)
  { t: 1.6, x: 0.75, y: 0.94 }, // Extrahovat metadata
  { t: 2.6, x: 0.81, y: 0.93 }, // potvrdit sablonu
  { t: 3.6, x: 0.842, y: 0.937 }, // spustit
];
export const F2_Metadata: React.FC = () => <DesktopFootageClip src="footage/f2-metadata.mp4" seconds={F2_SECONDS} steps={F2_STEPS} taps={F2_TAPS} />;
