import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene, useCaptions } from '../components/Scene';
import { Caption } from '../components/Text';
import { PhotoCard } from '../components/Illustrations';
import { WindowFrame } from '../components/Device';
import { APP_WIN, StepLabel } from '../components/Frame16';
import { settle, tween } from '../lib/anim';
import { captions } from '../copy/sk';
import { BRAND, FONT, INK, SAFE } from '../theme';

/**
 * Kolo 42: okno hned v rozmere a polohe okna footage F2 (Samuel: nezacinat v mensom ramiku, ktory sa zvacsi).
 * C6 - Fotka -> aplikacia. Bez simulacie UI: fotka stitku v strede sa
 * "nahra" (mierny pohyb hore), okolo nej sa vykresli okno aplikacie,
 * okno prejde presne do okna footage (F2, vlavo) = strih na footage
 * (rozpoznanie, navrh, potvrdenie uz ukaze appka); vpravo text, ze dalej
 * uz prebieha praca v desktopovej webovej aplikacii. 3 s.
 * Kolo 50: okno APP_WIN na celu sirku (ako F2), nadpis kroku hore vlavo.
 *
 * ms: 0 okno (z bielej) · 150 fotka v strede okna · 700 upload (kratke) ·
 * 900 text vpravo · 1900-2800 okno prejde do okna footage.
 */
// kolo 42: okno je od zaciatku v rozmere okna footage F2 (predtym mensie okno v strede, ktore sa zvacsilo)
const PH = { w: 380, h: 500 };

export const C6_Spracovanie: React.FC = () => {
  const frame = useCurrentFrame();
  const showCap = useCaptions();
  const tw = (s: number, d: number) => tween(frame, s, d);
  // kolo 52 (po vypusteni vety v kole 51 boli 3 s bez hlasu): 2 s, nadpis od zaciatku, upload skor, obsah zmizne pred F2
  const photo = settle(frame, 100);
  const upload = tw(450, 400);
  const chrome = tw(0, 350); // okno je na scene od zaciatku (z bielej), fotka v jeho strede
  const at = APP_WIN; // kolo 50: okno footage na celu sirku (F2)
  const bar = tw(500, 400); // progress "nahravanie" (kratke)
  return (
    <Scene mode="light">
      <WindowFrame at={at} chrome={chrome}>
        <div style={{ position: 'absolute', left: (at.w - PH.w) / 2, top: (at.h - 44 - PH.h - 40) / 2 - upload * 16, opacity: 1 - tw(1450, 400) }}>
          <PhotoCard w={PH.w} h={PH.h} t={photo} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: PH.h + 24, height: 8, borderRadius: 4, background: INK[200], opacity: bar > 0 && bar < 1 ? 1 : 1 - tw(950, 300) }}>
            <div style={{ width: `${bar * 100}%`, height: '100%', borderRadius: 4, background: INK[700] }} />
          </div>
        </div>
      </WindowFrame>
      {/* kolo 50: nadpis kroku hore vlavo ako v celom filme (predtym text vpravo s nazvom fazy a riadkom) */}
      <StepLabel frame={frame} steps={[{ from: 0, title: 'Fotka je v aplikácii' }]} opacity={1 - tw(1650, 300)} />
      {showCap ? <Caption text={captions.C6} t={settle(frame, 1200)} out={tw(1900, 300)} y={SAFE.captionY} /> : null}
    </Scene>
  );
};
