import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { LogoMark } from '../components/Scene';
import { BrandMod, BrandSep, BrandStack, LOCKUP, LOCKUP_W } from '../components/Brand';
import { loadFonts } from '../lib/fonts';
import { settle } from '../lib/anim';
import { captions, sk } from '../copy/sk';
import { BRAND, FONT } from '../theme';

/**
 * C9 - Outro na zelenom pozadi. Kolo 42: hore lockup Assetin Archives (assetin/.space | Archives, ako v C4)
 * a slogan pod nim, pod ciarou mala znacka, firma a web (kolo 43 pod sebou). Bez kontaktov.
 * ms: 200 lockup · 700 slogan · 1100 firma a web.
 */
const T = sk.S12;
const K = 0.62; // mierka lockupu (ako v C4 0,6)

export const C9_Outro: React.FC = () => {
  const frame = useCurrentFrame();
  React.useEffect(() => {
    loadFonts();
  }, []);
  const logo = settle(frame, 200);
  const tag = settle(frame, 700);
  const firm = settle(frame, 1100);
  const sepLeft = LOCKUP.stackW + LOCKUP.gap;
  const modLeft = sepLeft + LOCKUP.sepW + LOCKUP.gap;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${BRAND[800]} 0%, ${BRAND[600]} 100%)`, alignItems: 'center', justifyContent: 'center', fontFamily: FONT.body, color: '#fff' }}>
      {/* lockup Assetin Archives, biela verzia na zelenej */}
      <div style={{ width: LOCKUP_W * K, height: LOCKUP.sepH * K, position: 'relative', opacity: logo, transform: `translateY(${(1 - logo) * 14}px) scale(${0.96 + 0.04 * logo})` }}>
        <div style={{ position: 'absolute', left: 0, top: 0, transform: `scale(${K})`, transformOrigin: '0 0', width: LOCKUP_W, height: LOCKUP.sepH }}>
          <div style={{ position: 'absolute', left: 0, top: -2 }}>
            <BrandStack inColor={BRAND[200]} />
          </div>
          <div style={{ position: 'absolute', left: sepLeft, top: 0 }}>
            <BrandSep />
          </div>
          <div style={{ position: 'absolute', left: modLeft, top: -30 }}>
            <BrandMod />
          </div>
        </div>
      </div>
      <div style={{ marginTop: 44, fontFamily: FONT.display, fontWeight: 600, fontSize: 46, letterSpacing: '-0.01em', opacity: tag, transform: `translateY(${(1 - tag) * 14}px)` }}>{captions.C4brand}</div>
      <div style={{ width: 60, height: 5, background: BRAND[300], borderRadius: 3, marginTop: 56, opacity: firm }} />
      {/* kolo 43: firma a web pod sebou (v jednom riadku splyvali) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40, opacity: firm, transform: `translateY(${(1 - firm) * 14}px)` }}>
        <LogoMark size={64} color="#fff" />
        <div style={{ marginTop: 18, fontFamily: FONT.display, fontWeight: 600, fontSize: 34, lineHeight: 1.1 }}>{T.company}</div>
        <div style={{ marginTop: 8, fontSize: 38, fontWeight: 700, lineHeight: 1.1, color: BRAND[100] }}>{T.web}</div>
      </div>
    </AbsoluteFill>
  );
};
