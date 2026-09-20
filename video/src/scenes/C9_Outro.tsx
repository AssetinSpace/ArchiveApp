import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { LogoMark } from '../components/Scene';
import { loadFonts } from '../lib/fonts';
import { settle } from '../lib/anim';
import { sk } from '../copy/sk';
import { BRAND, FONT } from '../theme';

/** C9 - Outro na zelenom pozadi: logo, firma, web. Bez kontaktov. 5 s. */
const T = sk.S12;

export const C9_Outro: React.FC = () => {
  const frame = useCurrentFrame();
  React.useEffect(() => {
    loadFonts();
  }, []);
  const logo = settle(frame, 200);
  const name = settle(frame, 700);
  const web = settle(frame, 1000);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${BRAND[800]} 0%, ${BRAND[600]} 100%)`, alignItems: 'center', justifyContent: 'center', fontFamily: FONT.body, color: '#fff' }}>
      <div style={{ opacity: logo, transform: `scale(${0.7 + 0.3 * logo})` }}>
        <LogoMark size={190} color="#fff" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 44, opacity: name, transform: `translateY(${(1 - name) * 20}px)` }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 84, letterSpacing: '-0.02em', lineHeight: 1 }}>
          asset<span style={{ color: BRAND[200] }}>in</span>
        </span>
      </div>
      <div style={{ marginTop: 18, fontFamily: FONT.display, fontWeight: 600, fontSize: 34, opacity: name }}>{T.company}</div>
      <div style={{ width: 60, height: 5, background: BRAND[300], borderRadius: 3, marginTop: 34, opacity: web }} />
      <div style={{ marginTop: 26, fontSize: 40, fontWeight: 600, opacity: web, transform: `translateY(${(1 - web) * 20}px)` }}>{T.web}</div>
    </AbsoluteFill>
  );
};
