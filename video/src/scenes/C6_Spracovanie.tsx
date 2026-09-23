import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene, useCaptions } from '../components/Scene';
import { Caption } from '../components/Text';
import { PhotoCard } from '../components/Illustrations';
import { FOOTAGE_WINDOW, WindowFrame } from '../components/Device';
import { settle, tween } from '../lib/anim';
import { captions } from '../copy/sk';
import { BRAND, FONT, INK, SAFE } from '../theme';

/**
 * C6 - Fotka -> aplikacia. Bez simulacie UI: fotka stitku v strede sa
 * "nahra" (mierny pohyb hore), okolo nej sa vykresli okno aplikacie,
 * okno prejde presne do okna footage (F2, vlavo) = strih na footage
 * (rozpoznanie, navrh, potvrdenie uz ukaze appka); vpravo text, ze dalej
 * uz prebieha praca v desktopovej webovej aplikacii. 3 s.
 *
 * ms: 0 okno (z bielej) · 150 fotka v strede okna · 700 upload (kratke) ·
 * 900 text vpravo · 1900-2800 okno prejde do okna footage.
 */
const WIN = { x: 560, y: 90, w: 800, h: 700 };
const PH = { w: 380, h: 500 };

export const C6_Spracovanie: React.FC = () => {
  const frame = useCurrentFrame();
  const showCap = useCaptions();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const photo = settle(frame, 150);
  const upload = tw(700, 400);
  const chrome = tw(0, 350); // okno je na scene od zaciatku (z bielej), fotka v jeho strede
  const fill = tw(1900, 900); // okno prejde do FOOTAGE_WINDOW (bez roztiahnutia cez frame)
  const note = settle(frame, 900) * (1 - tw(2600, 300)); // text vpravo: dalej uz len v desktopovej aplikacii
  const at = { x: WIN.x + (FOOTAGE_WINDOW.x - WIN.x) * fill, y: WIN.y + (FOOTAGE_WINDOW.y - WIN.y) * fill, w: WIN.w + (FOOTAGE_WINDOW.w - WIN.w) * fill, h: WIN.h + (FOOTAGE_WINDOW.h - WIN.h) * fill };
  const bar = tw(750, 400); // progress "nahravanie" (kratke)
  return (
    <Scene mode="light" footer footerOpacity={1 - fill}>
      <WindowFrame at={at} chrome={chrome}>
        <div style={{ position: 'absolute', left: (at.w - PH.w) / 2, top: (at.h - 44 - PH.h - 40) / 2 - upload * 16, opacity: 1 - tw(2300, 400) }}>
          <PhotoCard w={PH.w} h={PH.h} t={photo} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: PH.h + 24, height: 8, borderRadius: 4, background: INK[200], opacity: bar > 0 && bar < 1 ? 1 : 1 - tw(1200, 300) }}>
            <div style={{ width: `${bar * 100}%`, height: '100%', borderRadius: 4, background: INK[700] }} />
          </div>
        </div>
      </WindowFrame>
      {/* text vpravo: koniec prace v terene, dalej desktop */}
      <div style={{ position: 'absolute', left: 1400, top: 0, width: 480, height: 1080, display: 'flex', flexDirection: 'column', justifyContent: 'center', opacity: note, transform: `translateX(${(1 - note) * 24}px)` }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 22, letterSpacing: '0.14em', textTransform: 'uppercase', color: BRAND[600], marginBottom: 14 }}>Z terénu do kancelárie</div>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 56, lineHeight: 1.05, color: INK[900], letterSpacing: '-0.02em', marginBottom: 14 }}>Fotka je v aplikácii</div>
        <div style={{ fontFamily: FONT.body, fontWeight: 400, fontSize: 30, lineHeight: 1.35, color: INK[500] }}>Ďalšia práca prebieha v desktopovej webovej aplikácii.</div>
      </div>
      {showCap ? <Caption text={captions.C6} t={settle(frame, 1200)} out={tw(1900, 300)} y={SAFE.captionY} /> : null}
    </Scene>
  );
};
