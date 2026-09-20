import React from 'react';
import { useCurrentFrame } from 'remotion';
import { LogoMark, Scene } from '../components/Scene';
import { settle, tween } from '../lib/anim';
import { BRAND, FONT } from '../theme';

/**
 * C1 - Intro. Domcek (LogoMark) v strede; spoza neho vyjde "assetin",
 * pod nim "Archives"; hold; texty sa zasunu spat; kamera prejde cez domcek
 * (najazd do vnutra), obraz sa vyplni navy = prvy frame C2. 5 s.
 *
 * ms: 300 domcek · 900-1500 wordmark vychadza · 1300-1900 Archives ·
 * 3000-3500 zasunutie · 3600-4700 najazd cez domcek.
 */
export const C1_Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const logo = settle(frame, 300);
  const out = tw(900, 600) * (1 - tw(3000, 500));
  const sub = tw(1300, 600) * (1 - tw(2900, 450));
  const zoom = tw(3600, 1100);
  const scale = 1 + zoom * 40;
  const MARK = 150;
  // lockup (domcek + text) je pocas drzania centrovany; pri zasunuti textu sa skupina
  // posunie tak, ze domcek skonci presne v strede - kamera potom letí do neho.
  const TEXT_W = 500; // sirka clip panelu
  const LOCK_W = 370; // skutocna sirka textu (assetin 96 px + padding)
  const back = tw(3000, 500);
  const shift = (-(LOCK_W - 10) / 2) * (1 - back);
  return (
    <Scene mode="dark">
      <div style={{ position: 'absolute', left: 960 - MARK / 2 + shift, top: 540 - MARK / 2, width: MARK, height: MARK, transform: `scale(${scale})`, transformOrigin: '45% 62%' }}>
        {/* text vychadza spoza domceka doprava a zasuva sa spat "do domceka" */}
        <div style={{ position: 'absolute', left: MARK - 10, top: -10, width: TEXT_W, height: 170, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 10, transform: `translateX(${(out - 1) * TEXT_W}px)`, opacity: Math.min(1, out * 2), fontFamily: FONT.display, fontWeight: 800, fontSize: 96, lineHeight: 1, color: '#fff', letterSpacing: '-0.02em', paddingLeft: 30, whiteSpace: 'nowrap' }}>
            asset<span style={{ color: BRAND[400] }}>in</span>
          </div>
          <div style={{ position: 'absolute', left: 0, top: 108, transform: `translateX(${(sub - 1) * TEXT_W}px)`, opacity: Math.min(1, sub * 2), fontFamily: FONT.display, fontWeight: 600, fontSize: 44, lineHeight: 1, color: BRAND[300], letterSpacing: '0.16em', textTransform: 'uppercase', paddingLeft: 34, whiteSpace: 'nowrap' }}>
            Archives
          </div>
        </div>
        {/* domcek: pri najazde sa jeho vnutro vyplni cely frame a stmavne do navy */}
        <div style={{ position: 'absolute', inset: 0, opacity: logo, transform: `scale(${0.85 + 0.15 * logo})` }}>
          <LogoMark size={MARK} color="#fff" />
          <div style={{ position: 'absolute', left: '18%', top: '44%', width: '52%', height: '38%', background: `rgba(8,17,31,${zoom})` }} />
        </div>
      </div>
      {/* prechod do navy na konci (prvy frame C2 je navy) */}
      <div style={{ position: 'absolute', inset: 0, background: '#08111F', opacity: tw(4400, 300) }} />
    </Scene>
  );
};
