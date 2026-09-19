import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { LogoMark } from '../components/Scene';
import { loadFonts } from '../lib/fonts';
import { settle } from '../lib/anim';
import { sk } from '../copy/sk';
import { BRAND, FONT } from '../theme';

/** S12 - Outro na zelenom pozadi ako strana 12 brozury; kontakty. 5 s. */
const T = sk.S12;

export const S12_Outro: React.FC = () => {
  const frame = useCurrentFrame();
  React.useEffect(() => {
    loadFonts();
  }, []);
  const logo = settle(frame, 200);
  const name = settle(frame, 700);
  const web = settle(frame, 1000);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${BRAND[800]} 0%, ${BRAND[600]} 100%)`, alignItems: 'center', fontFamily: FONT.body, color: '#fff' }}>
      <div style={{ marginTop: 150, opacity: logo, transform: `scale(${0.7 + 0.3 * logo})` }}>
        <LogoMark size={150} color="#fff" />
      </div>
      <div style={{ width: 60, height: 5, background: BRAND[300], borderRadius: 3, marginTop: 40, opacity: name }} />
      <div style={{ marginTop: 34, fontFamily: FONT.display, fontWeight: 700, fontSize: 46, opacity: name, transform: `translateY(${(1 - name) * 20}px)` }}>{T.company}</div>
      <div style={{ marginTop: 14, fontSize: 36, fontWeight: 600, opacity: web, transform: `translateY(${(1 - web) * 20}px)` }}>{T.web}</div>
      <div style={{ position: 'absolute', top: 700, display: 'flex', gap: 140 }}>
        {T.people.map(([n, role, tel, mail], i) => {
          const t = settle(frame, 1500 + i * 300);
          return (
            <div key={i} style={{ opacity: t, transform: `translateY(${(1 - t) * 20}px)` }}>
              <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 34 }}>{n}</div>
              <div style={{ fontSize: 24, color: BRAND[200], marginTop: 6 }}>{role}</div>
              <div style={{ fontSize: 26, marginTop: 18 }}>{tel}</div>
              <div style={{ fontSize: 26, color: BRAND[200], marginTop: 4 }}>{mail}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
