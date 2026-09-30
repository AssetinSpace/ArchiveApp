import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Lockup } from '../components/ArchivesBrand';
import { loadFonts } from '../lib/fonts';
import { settle } from '../lib/anim';
import { captions, sk } from '../copy/sk';
import { BRAND, FONT } from '../theme';

/**
 * C9 - Outro na zelenom pozadi. Kolo 42: hore lockup Assetin Archives a slogan pod nim, pod nimi firma a web (kolo 43
 * pod sebou). Bez kontaktov.
 * Kolo 49 (Samuel: znackovo ako kratka verzia): oficialne dvojriadkove logo vo verzii na zelenu (cele biele), slogan
 * "Digitalny poriadok v papierovom archive" (Manrope 600, BRAND[100]), web v obrysovej pilulke ako v kratkej, firma pod nou.
 * Mala znacka (domcek) a ciara vypadli, domcek je v logu.
 * ms: 200 logo · 700 slogan · 1100 web a firma.
 */
const T = sk.S12;

export const C9_Outro: React.FC = () => {
  const frame = useCurrentFrame();
  React.useEffect(() => {
    loadFonts();
  }, []);
  const logo = settle(frame, 200);
  const tag = settle(frame, 700);
  const firm = settle(frame, 1100);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${BRAND[800]} 0%, ${BRAND[600]} 100%)`, alignItems: 'center', justifyContent: 'center', fontFamily: FONT.body, color: '#fff' }}>
      <div style={{ marginTop: -30, opacity: logo, transform: `translateY(${(1 - logo) * 14}px) scale(${0.96 + 0.04 * logo})` }}>
        <Lockup height={210} colors="onGreen" />
      </div>
      <div style={{ marginTop: 56, fontFamily: FONT.display, fontWeight: 600, fontSize: 50, lineHeight: 1.2, letterSpacing: '-0.01em', color: BRAND[100], opacity: tag, transform: `translateY(${(1 - tag) * 14}px)` }}>{captions.C4brand}</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 64, opacity: firm, transform: `translateY(${(1 - firm) * 14}px)` }}>
        <div style={{ padding: '12px 32px', borderRadius: 40, border: '2px solid rgba(255,255,255,0.45)', fontFamily: FONT.display, fontWeight: 700, fontSize: 38, letterSpacing: '0.01em', lineHeight: 1.1 }}>{T.web}</div>
        <div style={{ marginTop: 22, fontFamily: FONT.display, fontWeight: 600, fontSize: 30, lineHeight: 1.1, color: BRAND[100] }}>{T.company}</div>
      </div>
    </AbsoluteFill>
  );
};
