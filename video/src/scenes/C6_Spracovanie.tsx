import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene, useCaptions } from '../components/Scene';
import { Caption } from '../components/Text';
import { PhotoCard } from '../components/Illustrations';
import { FOOTAGE_WINDOW, WindowFrame } from '../components/Device';
import { settle, tween } from '../lib/anim';
import { captions } from '../copy/sk';
import { INK, SAFE } from '../theme';

/**
 * C6 - Fotka -> aplikacia. Bez simulacie UI: fotka stitku v strede sa
 * "nahra" (mierny pohyb hore), okolo nej sa vykresli okno aplikacie,
 * okno prejde presne do okna footage (F2, vlavo) = strih na footage
 * (rozpoznanie, navrh, potvrdenie uz ukaze appka). 4 s.
 *
 * ms: 300 fotka · 1000 upload · 1600 okno · 1800 caption · 2500 out ·
 * 2600-3600 okno prejde do okna footage.
 */
const WIN = { x: 560, y: 90, w: 800, h: 700 };
const PH = { w: 380, h: 500 };

export const C6_Spracovanie: React.FC = () => {
  const frame = useCurrentFrame();
  const showCap = useCaptions();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const photo = settle(frame, 300);
  const upload = tw(1000, 600);
  const chrome = tw(1600, 500);
  const fill = tw(2600, 1000); // okno prejde do FOOTAGE_WINDOW (bez roztiahnutia cez frame)
  const at = { x: WIN.x + (FOOTAGE_WINDOW.x - WIN.x) * fill, y: WIN.y + (FOOTAGE_WINDOW.y - WIN.y) * fill, w: WIN.w + (FOOTAGE_WINDOW.w - WIN.w) * fill, h: WIN.h + (FOOTAGE_WINDOW.h - WIN.h) * fill };
  const bar = tw(1100, 600); // progress "nahravanie"
  return (
    <Scene mode="light" footer footerOpacity={1 - fill}>
      <WindowFrame at={at} chrome={chrome}>
        <div style={{ position: 'absolute', left: (at.w - PH.w) / 2, top: 70 - upload * 30, opacity: 1 - tw(3000, 500) }}>
          <PhotoCard w={PH.w} h={PH.h} t={photo} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: PH.h + 24, height: 8, borderRadius: 4, background: INK[200], opacity: bar > 0 && bar < 1 ? 1 : 1 - tw(1800, 400) }}>
            <div style={{ width: `${bar * 100}%`, height: '100%', borderRadius: 4, background: INK[700] }} />
          </div>
        </div>
      </WindowFrame>
      {showCap ? <Caption text={captions.C6} t={settle(frame, 1800)} out={tw(2500, 300)} y={SAFE.captionY} /> : null}
    </Scene>
  );
};
