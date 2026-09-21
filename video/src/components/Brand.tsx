import React from 'react';
import { BRAND, FONT, NAVY } from '../theme';

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
  sepH: 150,
  modW: 560, // sirka "Archives" pri 140 px
};
export const LOCKUP_W = LOCKUP.stackW + LOCKUP.gap + LOCKUP.sepW + LOCKUP.gap + LOCKUP.modW;

export const BrandStack: React.FC<{ domain?: number; style?: React.CSSProperties }> = ({ domain = 1, style }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: LOCKUP.stackW, ...style }}>
    <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 84, lineHeight: 1, color: '#fff', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
      asset<span style={{ color: BRAND[400] }}>in</span>
    </div>
    <div style={{ fontFamily: FONT.display, fontWeight: 500, fontSize: 44, lineHeight: 1, color: NAVY[300], letterSpacing: '-0.01em', marginTop: 6, whiteSpace: 'nowrap', opacity: Math.min(1, domain * 1.5), transform: `translateY(${(1 - domain) * -18}px)` }}>
      .space
    </div>
  </div>
);

export const BrandSep: React.FC<{ t?: number }> = ({ t = 1 }) => (
  <div style={{ width: LOCKUP.sepW, height: LOCKUP.sepH, display: 'flex', alignItems: 'center' }}>
    <div style={{ width: LOCKUP.sepW, height: LOCKUP.sepH * t, borderRadius: 2, background: NAVY[300], opacity: 0.6 }} />
  </div>
);

export const BrandMod: React.FC<{ text?: string; style?: React.CSSProperties }> = ({ text = 'Archives', style }) => (
  <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 140, lineHeight: 1, color: '#fff', letterSpacing: '-0.02em', whiteSpace: 'nowrap', ...style }}>{text}</div>
);
