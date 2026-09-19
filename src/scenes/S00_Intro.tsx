import React from 'react';
import { useCurrentFrame } from 'remotion';
import { LogoMark, Scene } from '../components/Scene';
import { settle, tween } from '../lib/anim';
import { sk } from '../copy/sk';
import { BRAND, FONT, NAVY, W } from '../theme';

/** S00 - Intro. Logo sa nakresli, wordmark doskoci, titulok, zeleny pas. 5 s. */
export const S00_Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = tween(frame, 200, 1100);
  const fill = tween(frame, 1100, 500);
  const word = settle(frame, 1300);
  const title = settle(frame, 1900);
  const sub = settle(frame, 2300);
  const tag = settle(frame, 2800);
  const band = tween(frame, 2600, 900);
  return (
    <Scene mode="dark" footer={false}>
      <div style={{ position: 'absolute', left: 120, top: 100, display: 'flex', alignItems: 'center', gap: 22, opacity: word }}>
        <div style={{ position: 'relative', width: 64 }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 1 - fill }}>
            <LogoMark size={64} color="#fff" draw={draw} />
          </div>
          <div style={{ opacity: fill }}>
            <LogoMark size={64} color="#fff" />
          </div>
        </div>
        <span style={{ width: 1, height: 44, background: NAVY[700] }} />
        <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 48, color: '#fff' }}>
          asset<span style={{ color: BRAND[400] }}>in</span>
        </span>
      </div>

      <div style={{ position: 'absolute', left: 120, top: 560 }}>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 132,
            letterSpacing: '-0.02em',
            color: '#fff',
            lineHeight: 1,
            opacity: title,
            transform: `translateY(${(1 - title) * 30}px)`,
          }}
        >
          {sk.S00.title}
        </div>
        <div
          style={{
            marginTop: 26,
            fontFamily: FONT.body,
            fontWeight: 500,
            fontSize: 42,
            color: BRAND[300],
            opacity: sub,
            transform: `translateY(${(1 - sub) * 24}px)`,
          }}
        >
          {sk.S00.sub}
        </div>
        <div
          style={{
            marginTop: 40,
            fontFamily: FONT.body,
            fontSize: 30,
            color: NAVY[200],
            opacity: tag,
            transform: `translateY(${(1 - tag) * 20}px)`,
          }}
        >
          {sk.S00.tag}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, bottom: 0, width: W * 0.62 * band, height: 12, background: BRAND[600] }} />
    </Scene>
  );
};
