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
  return (
    <Scene mode="dark">
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', transform: `scale(${scale})`, transformOrigin: '50% 47%' }}>
          {/* domcek: pri najazde sa jeho vnutro (biela) vyplni cely frame, potom stmavne do navy */}
          <div style={{ position: 'relative', width: MARK, zIndex: 2, opacity: logo, transform: `scale(${0.85 + 0.15 * logo})` }}>
            <LogoMark size={MARK} color="#fff" />
            <div style={{ position: 'absolute', left: '22%', top: '46%', width: '42%', height: '30%', background: `rgba(8,17,31,${zoom})` }} />
          </div>
          {/* wordmark vychadza spoza domceka doprava */}
          <div style={{ position: 'relative', overflow: 'hidden', width: 520, height: 170, marginLeft: -10 }}>
            <div style={{ position: 'absolute', left: 0, top: 10, transform: `translateX(${(out - 1) * 520}px)`, opacity: Math.min(1, out * 2), fontFamily: FONT.display, fontWeight: 800, fontSize: 96, lineHeight: 1, color: '#fff', letterSpacing: '-0.02em', paddingLeft: 30 }}>
              asset<span style={{ color: BRAND[400] }}>in</span>
            </div>
            <div style={{ position: 'absolute', left: 0, top: 108, transform: `translateX(${(sub - 1) * 520}px)`, opacity: Math.min(1, sub * 2), fontFamily: FONT.display, fontWeight: 600, fontSize: 44, lineHeight: 1, color: BRAND[300], letterSpacing: '0.16em', textTransform: 'uppercase', paddingLeft: 34 }}>
              Archives
            </div>
          </div>
        </div>
      </div>
      {/* prechod do navy na konci (prvy frame C2 je navy) */}
      <div style={{ position: 'absolute', inset: 0, background: '#08111F', opacity: tw(4400, 300) }} />
    </Scene>
  );
};
