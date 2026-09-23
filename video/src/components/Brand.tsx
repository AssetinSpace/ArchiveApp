import React from 'react';
import { BRAND, FONT, INK, NAVY } from '../theme';

/**
 * Lockup podla assetin-design-kitu (.brand-lockup.rule.on-navy):
 *   .brand-logo.stacked  = "assetin" (asset biele, in zelene) + ".space" pod tym (sive)
 *   .sep                 = zvisly oddelovac
 *   .mod                 = modul "Archives"
 * Rozmery su pre 1080p; `k` skaluje cely lockup.
 */
export const LOCKUP = {
  stackW: 340, // sirka "assetin" pri 84 px
  gap: 28,
  sepW: 4,
  sepH: 170,
  modW: 951, // sirka "Archives" pri 230 px (namerane, aby bol lockup na strede)
  modSize: 230,
  stackSize: 84,
};
export const LOCKUP_W = LOCKUP.stackW + LOCKUP.gap + LOCKUP.sepW + LOCKUP.gap + LOCKUP.modW;

export const BrandStack: React.FC<{ domain?: number; light?: boolean; style?: React.CSSProperties }> = ({ domain = 1, light = false, style }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: LOCKUP.stackW, ...style }}>
    <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: LOCKUP.stackSize, lineHeight: 0.9, color: light ? INK[900] : '#fff', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
      asset<span style={{ color: light ? BRAND[600] : BRAND[400] }}>in</span>
    </div>
    {/* .space: rovnaky typ aj velkost pisma ako assetin, len tenkie a sive */}
    <div style={{ fontFamily: FONT.display, fontWeight: 500, fontSize: LOCKUP.stackSize, lineHeight: 0.9, color: light ? INK[400] : NAVY[300], letterSpacing: '-0.02em', marginTop: 0, marginLeft: -4, whiteSpace: 'nowrap', opacity: Math.min(1, domain * 1.5), transform: `translateY(${(1 - domain) * -18}px)` }}>
      .space
    </div>
  </div>
);

export const BrandSep: React.FC<{ t?: number; light?: boolean }> = ({ t = 1, light = false }) => (
  <div style={{ width: LOCKUP.sepW, height: LOCKUP.sepH, display: 'flex', alignItems: 'center' }}>
    <div style={{ width: LOCKUP.sepW, height: LOCKUP.sepH * t, borderRadius: 2, background: light ? INK[300] : NAVY[300], opacity: 0.6 }} />
  </div>
);

export const BrandMod: React.FC<{ text?: string; light?: boolean; style?: React.CSSProperties }> = ({ text = 'Archives', light = false, style }) => (
  <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: LOCKUP.modSize, lineHeight: 1, color: light ? INK[900] : '#fff', letterSpacing: '-0.02em', whiteSpace: 'nowrap', ...style }}>{text}</div>
);
