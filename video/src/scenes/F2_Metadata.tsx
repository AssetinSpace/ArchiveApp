import React from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion';
import { FOOTAGE_WINDOW, WindowFrame } from '../components/Device';
import { Step, StepsPanel } from '../components/Steps';
import { settle, tween } from '../lib/anim';
import { loadFonts } from '../lib/fonts';

/**
 * Desktop footage (screen recording z prehliadaca) v okne aplikacie vlavo
 * (FOOTAGE_WINDOW, rovnake okno, do ktoreho dosla predchadzajuca scena),
 * vpravo sprievodne kroky. Zaznam je orezany o listu prehliadaca a bocny
 * panel appky (1520 x 882), skaluje sa presne na obsah okna.
 * Zdroj: public/footage/ (priecinok nie je v gite).
 */
export const DesktopFootageClip: React.FC<{ src: string; seconds: number; steps: Step[] }> = ({ src, seconds, steps }) => {
  const frame = useCurrentFrame();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const screenIn = tw(0, 300); // obsah okna: z bielej (koniec predchadzajucej sceny) do zaznamu
  const fadeOut = tw(seconds * 1000 - 500, 400);
  const textIn = settle(frame, 300);
  React.useEffect(() => {
    loadFonts();
  }, []);
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      <WindowFrame at={FOOTAGE_WINDOW}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#fff' }}>
          <OffthreadVideo src={staticFile(src)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 1 - screenIn, pointerEvents: 'none' }} />
        </div>
      </WindowFrame>
      <StepsPanel frame={frame} steps={steps} opacity={textIn} />
      <AbsoluteFill style={{ background: '#fff', opacity: fadeOut, pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};

/**
 * F2 - Extrakcia metadat (36 s zaznam zostrihany na 8 s): prehlad priloh
 * (3,0-3,8 s) + vyber prilohy a "Extrahovat metadata" (14,5-17,0 s, dialog
 * vystrihnuty), stranka Kontroly s nahladom a priebehom (18-21 s, 21-23,5 s 1,7x).
 */
export const F2_SECONDS = 8;
const F2_STEPS: Step[] = [
  { from: 0, title: 'Príloha čaká', line: 'Fotka štítku je pri zložke ZL_01, pripravená na extrakciu.' },
  { from: 1800, title: 'Extrahovať metadáta', line: 'Jeden klik. Údaje sa čítajú z fotky.' },
  { from: 3400, title: 'Návrh na kontrolu', line: 'Aplikácia rozpozná text a navrhne metadáta. Platné sú až po kontrole človekom.' },
];
export const F2_Metadata: React.FC = () => <DesktopFootageClip src="footage/f2-metadata.mp4" seconds={F2_SECONDS} steps={F2_STEPS} />;
