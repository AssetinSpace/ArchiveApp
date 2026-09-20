import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene, useCaptions } from '../components/Scene';
import { Caption } from '../components/Text';
import { Carton, Pallet } from '../lib/iso';
import { PriceTag, Sheet } from '../components/Illustrations';
import { pop, settle } from '../lib/anim';
import { captions } from '../copy/sk';
import { BRAND, FONT, NAVY } from '../theme';

/** C3 - Cena: velke 2x v strede, po stranach paleta a vykres s cenovkami. 7 s. */
export const C3_Cena: React.FC = () => {
  const frame = useCurrentFrame();
  const showCap = useCaptions();
  const big = pop(frame, 700, { damping: 12 });
  const a = settle(frame, 1600);
  const b = settle(frame, 2000);
  const tagA = pop(frame, 2600);
  const tagB = pop(frame, 3100);
  return (
    <Scene mode="dark">
      <div style={{ position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', opacity: big, transform: `scale(${0.6 + 0.4 * big})` }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 300, lineHeight: 0.9, color: BRAND[400], letterSpacing: '-0.04em' }}>2×</span>
      </div>
      {/* lava ikona: paleta */}
      <div style={{ position: 'absolute', left: 380, top: 470, opacity: a, transform: `translateY(${(1 - a) * 30}px)` }}>
        <svg width={440} height={340} viewBox="-180 -80 360 280">
          <Pallet x={-48} y={-48} w={96} d={96} />
          <Carton x={-42} y={-42} z={14} w={40} d={40} h={32} />
          <Carton x={2} y={-42} z={14} w={40} d={40} h={32} />
          <Carton x={-42} y={2} z={14} w={40} d={40} h={32} />
          <Carton x={2} y={2} z={14} w={40} d={40} h={32} />
          <Carton x={-20} y={-20} z={46} w={40} d={40} h={32} />
        </svg>
        <div style={{ position: 'absolute', left: 60, top: -40 }}>
          <PriceTag text="skladovanie" s={tagA} color={BRAND[700]} />
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center', fontFamily: FONT.display, fontWeight: 800, fontSize: 90, color: NAVY[300], opacity: b }}>+</div>
      {/* prava ikona: novy vykres */}
      <div style={{ position: 'absolute', left: 1220, top: 460, opacity: b, transform: `translateY(${(1 - b) * 30}px) rotate(-4deg)` }}>
        <Sheet w={220} h={280} lines={6} stamp />
        <div style={{ position: 'absolute', left: -20, top: -30 }}>
          <PriceTag text="nové zameranie" s={tagB} color={BRAND[700]} />
        </div>
      </div>
      {showCap ? <Caption text={captions.C3} mode="dark" t={settle(frame, 4000)} y={870} /> : null}
    </Scene>
  );
};
