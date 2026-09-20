import React from 'react';
import { useCurrentFrame } from 'remotion';
import { LogoMark, Scene } from '../components/Scene';
import { settle, tween } from '../lib/anim';
import { sk } from '../copy/sk';
import { BRAND, FONT, NAVY, W } from '../theme';

/** C1 - Intro: logo sa nakresli, wordmark, titul, zeleny pas. 4 s. */
export const C1_Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = tween(frame, 200, 1000);
  const fill = tween(frame, 1000, 400);
  const word = settle(frame, 1200);
  const title = settle(frame, 1800);
  const band = tween(frame, 2300, 900);
  return (
    <Scene mode="dark">
      <div style={{ position: 'absolute', left: 0, right: 0, top: 330, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, opacity: Math.max(draw > 0 ? 1 : 0, word) }}>
          <div style={{ position: 'relative', width: 96, height: 104 }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 1 - fill }}>
              <LogoMark size={96} color="#fff" draw={draw} />
            </div>
            <div style={{ position: 'absolute', inset: 0, opacity: fill }}>
              <LogoMark size={96} color="#fff" />
            </div>
          </div>
          <span style={{ width: 2, height: 64, background: NAVY[700], opacity: word }} />
          <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 72, color: '#fff', opacity: word, transform: `translateX(${(1 - word) * -20}px)` }}>
            asset<span style={{ color: BRAND[400] }}>in</span>
          </span>
        </div>
        <div
          style={{
            marginTop: 70,
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 124,
            letterSpacing: '-0.02em',
            color: '#fff',
            lineHeight: 1,
            opacity: title,
            transform: `translateY(${(1 - title) * 30}px)`,
          }}
        >
          {sk.S00.title}
        </div>
      </div>
      <div style={{ position: 'absolute', left: (W * (1 - 0.5 * band)) / 2, bottom: 0, width: W * 0.5 * band, height: 12, background: BRAND[600] }} />
    </Scene>
  );
};
