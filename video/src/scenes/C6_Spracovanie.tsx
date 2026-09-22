import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene, useCaptions } from '../components/Scene';
import { Caption } from '../components/Text';
import { PhotoCard } from '../components/Illustrations';
import { WindowFrame } from '../components/Device';
import { settle, tween } from '../lib/anim';
import { captions } from '../copy/sk';
import { INK, SAFE } from '../theme';

/**
 * C6 - Fotka -> aplikacia. Bez simulacie UI: fotka stitku v strede sa
 * "nahra" (mierny pohyb hore), okolo nej sa vykresli okno aplikacie,
 * okno najde na cely frame = strih na footage (rozpoznanie, navrh, potvrdenie
 * uz ukaze appka). 7 s.
 *
 * ms: 400 fotka · 1600 upload · 2200 okno · 3000 caption · 4600 out ·
 * 4800-5900 najazd · hold.
 */
const WIN = { x: 560, y: 90, w: 800, h: 700 };
const PH = { w: 380, h: 500 };

export const C6_Spracovanie: React.FC = () => {
  const frame = useCurrentFrame();
  const showCap = useCaptions();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const photo = settle(frame, 400);
  const upload = tw(1600, 700);
  const chrome = tw(2200, 500);
  const fill = tw(4800, 1100);
  const bar = tw(1800, 900); // progress "nahravanie"
  return (
    <Scene mode="light" footer footerOpacity={1 - fill}>
      <WindowFrame at={WIN} fill={fill} chrome={chrome}>
        <div style={{ position: 'absolute', left: (WIN.w - PH.w) / 2, top: 70 - upload * 30, transform: `scale(${1 + 0.3 * fill})`, transformOrigin: '50% 0', opacity: 1 - tw(5300, 500) }}>
          <PhotoCard w={PH.w} h={PH.h} t={photo} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: PH.h + 24, height: 8, borderRadius: 4, background: INK[200], opacity: bar > 0 && bar < 1 ? 1 : 1 - tw(2900, 400) }}>
            <div style={{ width: `${bar * 100}%`, height: '100%', borderRadius: 4, background: INK[700] }} />
          </div>
        </div>
      </WindowFrame>
      {showCap ? <Caption text={captions.C6} t={settle(frame, 3000)} out={tw(4600, 300)} y={SAFE.captionY} /> : null}
    </Scene>
  );
};
