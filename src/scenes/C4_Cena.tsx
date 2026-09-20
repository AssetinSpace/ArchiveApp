import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene, useCaptions } from '../components/Scene';
import { Caption } from '../components/Text';
import { Carton, Pallet } from '../lib/iso';
import { PriceTag } from '../components/Illustrations';
import { pop, settle, tween } from '../lib/anim';
import { captions } from '../copy/sk';
import { BRAND, CM, FONT, NAVY, SAFE } from '../theme';

/**
 * C4 - Cena: velke 2x, dve rovnake palety v jednej mierke (2.2 px/cm):
 * prva s cenovkou "skladovanie", druha sa skopiruje z prvej s cenovkou
 * "nove vyhotovenie". 7 s.
 */
const PX = 2.2;
const Stack: React.FC = () => (
  <g>
    <Pallet x={0} y={0} />
    <Carton x={6} y={4} z={14} />
    <Carton x={62} y={4} z={14} />
    <Carton x={6} y={42} z={14} />
    <Carton x={62} y={42} z={14} />
    <Carton x={34} y={22} z={14 + CM.carton.h} />
  </g>
);

export const C4_Cena: React.FC = () => {
  const frame = useCurrentFrame();
  const showCap = useCaptions();
  const big = pop(frame, 700, { damping: 12 });
  const a = settle(frame, 1500);
  const copy = tween(frame, 2200, 900);
  const tagA = pop(frame, 2000);
  const tagB = pop(frame, 3300);
  const eq = settle(frame, 3100);
  // paleta: iso sirka (w+d)*PX = 440 px, vyska ~ (w+d)/2 + 14 + 72 = 186 cm -> 410 px
  const W = (CM.pallet.w + CM.pallet.d) * PX;
  const H = ((CM.pallet.w + CM.pallet.d) / 2 + 14 + CM.carton.h * 2 + 10) * PX;
  const left1 = 520 - W / 2,
    left2 = 1400 - W / 2;
  const top = SAFE.illoBottom - H - 10;
  const Pal: React.FC<{ left: number; t: number }> = ({ left, t }) => (
    <svg width={W} height={H} viewBox={`${-CM.pallet.d} ${-(CM.carton.h * 2 + 24)} ${CM.pallet.w + CM.pallet.d} ${H / PX}`} style={{ position: 'absolute', left, top, opacity: t }}>
      <Stack />
    </svg>
  );
  return (
    <Scene mode="dark">
      <div style={{ position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center', opacity: big, transform: `scale(${0.6 + 0.4 * big})` }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 250, lineHeight: 0.9, color: BRAND[400], letterSpacing: '-0.04em' }}>2×</span>
      </div>
      <Pal left={left1} t={a} />
      {/* kopia: vychadza z prvej palety a posunie sa doprava */}
      <div style={{ position: 'absolute', inset: 0, opacity: copy, transform: `translateX(${(copy - 1) * (left2 - left1)}px)` }}>
        <Pal left={left2} t={1} />
      </div>
      <div style={{ position: 'absolute', left: left1 + 40, top: top - 10 }}>
        <PriceTag text="skladovanie" s={tagA} color={BRAND[700]} />
      </div>
      <div style={{ position: 'absolute', left: left2 + 40, top: top - 10 }}>
        <PriceTag text="nové vyhotovenie" s={tagB} color={BRAND[700]} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center', fontFamily: FONT.display, fontWeight: 800, fontSize: 90, color: NAVY[300], opacity: eq }}>+</div>
      {showCap ? <Caption text={captions.C4} mode="dark" t={settle(frame, 4000)} y={SAFE.captionY} /> : null}
    </Scene>
  );
};
