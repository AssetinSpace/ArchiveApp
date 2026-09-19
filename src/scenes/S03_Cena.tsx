import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene } from '../components/Scene';
import { TextColumn } from '../components/Text';
import { Carton, Pallet } from '../lib/iso';
import { PriceTag, Sheet } from '../components/Illustrations';
import { pop, settle } from '../lib/anim';
import { sk } from '../copy/sk';
import { BRAND, FONT, NAVY } from '../theme';

/** S03 - Cena problemu: 2x zaplatene. 7 s. */
const T = sk.S03;

export const S03_Cena: React.FC = () => {
  const frame = useCurrentFrame();
  const big = pop(frame, 900, { damping: 12 });
  const cardA = settle(frame, 1600);
  const cardB = settle(frame, 2100);
  const tagA = pop(frame, 2700);
  const tagB = pop(frame, 3300);
  const eq = settle(frame, 3900);

  const Card: React.FC<{ t: number; title: string; children: React.ReactNode }> = ({ t, title, children }) => (
    <div
      style={{
        width: 380,
        height: 400,
        borderRadius: 16,
        background: 'rgba(255,255,255,0.05)',
        border: `1.5px solid ${NAVY[700]}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 26,
        gap: 22,
        opacity: t,
        transform: `translateY(${(1 - t) * 30}px)`,
        position: 'relative',
      }}
    >
      {children}
      <div style={{ fontFamily: FONT.body, fontSize: 26, color: NAVY[200], textAlign: 'center', padding: '0 24px', lineHeight: 1.3 }}>{title}</div>
    </div>
  );

  return (
    <Scene mode="dark">
      <TextColumn
        mode="dark"
        kicker={T.kicker}
        lines={T.h}
        tKicker={settle(frame, 0)}
        tLines={[settle(frame, 150), settle(frame, 280)]}
        width={860}
        headlineSize={54}
      />
      <div style={{ position: 'absolute', left: 120, top: 470, opacity: big, transform: `scale(${0.6 + 0.4 * big})`, transformOrigin: 'left top' }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 220, lineHeight: 0.95, color: BRAND[400], letterSpacing: '-0.03em' }}>{T.big}</div>
        <div style={{ fontFamily: FONT.body, fontSize: 32, color: '#fff', marginTop: 18 }}>{T.bigSub}</div>
      </div>

      <div style={{ position: 'absolute', left: 1000, top: 250, display: 'flex', gap: 40, alignItems: 'flex-end' }}>
        <Card t={cardA} title={T.a}>
          <svg width={300} height={230} viewBox="-150 -60 300 230">
            <Pallet x={-40} y={-40} w={80} d={80} />
            <Carton x={-34} y={-34} z={14} w={34} d={34} h={28} />
            <Carton x={2} y={-34} z={14} w={34} d={34} h={28} />
            <Carton x={-34} y={2} z={14} w={34} d={34} h={28} />
            <Carton x={2} y={2} z={14} w={34} d={34} h={28} />
            <Carton x={-16} y={-16} z={42} w={34} d={34} h={28} />
          </svg>
          <div style={{ position: 'absolute', left: 24, top: 24 }}>
            <PriceTag text="skladovanie / rok" s={tagA} color={BRAND[700]} />
          </div>
        </Card>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 64, color: NAVY[300], paddingBottom: 170, opacity: eq }}>+</div>
        <Card t={cardB} title={T.b}>
          <div style={{ transform: 'rotate(-4deg)' }}>
            <Sheet w={180} h={230} lines={6} stamp />
          </div>
          <div style={{ position: 'absolute', left: 24, top: 24 }}>
            <PriceTag text="nové zameranie" s={tagB} color={BRAND[700]} />
          </div>
        </Card>
      </div>
    </Scene>
  );
};
