import React from 'react';
import { Easing, useCurrentFrame } from 'remotion';
import { ARCHIVES_LOGO } from '../scenes/kratka/archivesLogo';
import { pop, tween } from '../lib/anim';
import { BRAND, FONT } from '../theme';

/**
 * Znacka Assetin Archives pre dlhu verziu (kolo 49, Samuel: dlhu verziu znackovo zjednotit s kratkou LinkedIn verziou).
 * Prevzate z experimentu kratkej verzie (scenes/kratka/LinkedIn.tsx, kola 26 az 29), rozmery pre 16:9.
 *
 * `Lockup`: oficialne dvojriadkove logo (domcek | assetin nad ARCHIVES) z finalnych podkladov
 * (podklady/archives-logo-final, cesty v scenes/kratka/archivesLogo.ts, generuje scripts/archives_logo.py).
 * `colors` = verzia loga: na bielej (ARCHIVES tmavomodre), na tmavomodrej (inverzna), na zelenej (cele biele).
 * `height` = vyska v px (sirka 3,96 x vyssia). `build` = ms klipu, od ktoreho sa logo posklada (ciara narastie, domcek
 * dosadne, assetin a ARCHIVES vyjdu zospodu z masky); bez neho je logo hotove.
 */
const OUT_EXPO = Easing.bezier(0.16, 1, 0.3, 1);
const HOUSE_C = { x: 35.8, y: 38.4 }; // stred domceka v dvojriadkovom logu
export type LogoColors = 'color' | 'inverse' | 'onGreen';
export const Lockup: React.FC<{ height: number; colors?: LogoColors; build?: number }> = ({ height, colors = 'color', build }) => {
  const frame = useCurrentFrame();
  const id = 'lk' + React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const L = ARCHIVES_LOGO.two;
  const c = L[colors];
  const [VW, VH] = L.view;
  const k = height / VH;
  const b = (a: number, d: number) => (build === undefined ? 1 : tween(frame, build + a, d, OUT_EXPO));
  const sepK = b(0, 480);
  const markK = build === undefined ? 1 : pop(frame, build + 60, { damping: 18 });
  const w1 = b(150, 650); // assetin
  const w2 = b(300, 650); // ARCHIVES
  const [dx, dy, dw, dh] = L.divider;
  const mid = dy + dh / 2;
  return (
    <svg width={VW * k} height={(VH + 0.6) * k} viewBox={`0 0 ${VW} ${VH + 0.6}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <clipPath id={`${id}a`}>
          <rect x={110} y={-6} width={VW - 104} height={52} />
        </clipPath>
        <clipPath id={`${id}b`}>
          <rect x={110} y={50} width={VW - 104} height={32} />
        </clipPath>
      </defs>
      <g opacity={Math.min(1, markK * 1.6)} transform={`translate(${HOUSE_C.x} ${HOUSE_C.y}) scale(${0.45 + 0.55 * markK}) translate(${-HOUSE_C.x} ${-HOUSE_C.y})`}>
        <g transform={L.houseTransform} fill={c.house}>
          <path d={ARCHIVES_LOGO.houseD} />
        </g>
      </g>
      <rect x={dx} y={dy} width={dw} height={dh} fill={c.divider} transform={`translate(0 ${mid}) scale(1 ${sepK}) translate(0 ${-mid})`} />
      <g clipPath={`url(#${id}a)`}>
        <g transform={`translate(0 ${(1 - w1) * 50})`} opacity={Math.min(1, w1 * 1.6)}>
          <path d={L.asset} fill={c.asset} />
          <path d={L.in} fill={c.in} />
        </g>
      </g>
      <g clipPath={`url(#${id}b)`}>
        <g transform={`translate(0 ${(1 - w2) * 30})`} opacity={Math.min(1, w2 * 1.6)}>
          <path d={L.archives} fill={c.archives} />
        </g>
      </g>
    </svg>
  );
};

/**
 * Logo v pravom dolnom rohu pocas celeho filmu (ako v kratkej verzii od kola 29, nahradza patu s domcekom, assetin,
 * Archives a webom). Kolo 50: 56 px vysoke, uaziara ARCHIVES 36 px od spodku, vpravo 120 px ako okno aplikacie a nadpis
 * vlavo; pod riadkom titulkov (900 az 963 px). Na tmavom verzia na tmavomodru, inak na bielu.
 */
export const CORNER = { h: 56, right: 120, base: 36 }; // kolo 50: vpravo zarovnane s oknom aplikacie (FRAME.side)
export const CornerBrand: React.FC<{ dark?: boolean; opacity?: number }> = ({ dark = false, opacity = 1 }) => {
  if (opacity <= 0) return null;
  const k = CORNER.h / ARCHIVES_LOGO.two.view[1];
  return (
    <div style={{ position: 'absolute', right: CORNER.right, bottom: CORNER.base - 0.6 * k, opacity, pointerEvents: 'none' }}>
      <Lockup height={CORNER.h} colors={dark ? 'inverse' : 'color'} />
    </div>
  );
};

/** Zelena pilulka s fajkou (vyzva "Zadarmo a nezavazne", ako v kratkej verzii). `size` = velkost pisma. */
export const FreePill: React.FC<{ text: string; size?: number }> = ({ text, size = 54 }) => {
  const k = size / 54;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 18 * k, padding: `${22 * k}px ${44 * k}px`, borderRadius: 999, background: `linear-gradient(160deg, ${BRAND[700]} 0%, ${BRAND[600]} 100%)`, boxShadow: '0 18px 40px rgba(31,122,51,0.25)', fontFamily: FONT.display, fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: '-0.01em', color: '#fff', whiteSpace: 'nowrap' }}>
      <svg width={52 * k} height={52 * k} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
        <path d="M4.5 12.5 L10 18 L19.5 6.5" />
      </svg>
      {text}
    </div>
  );
};
