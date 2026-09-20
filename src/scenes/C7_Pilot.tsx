import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene, useCaptions } from '../components/Scene';
import { Caption } from '../components/Text';
import { ArchiveBox } from '../components/ArchiveBox';
import { Sheet } from '../components/Illustrations';
import { pop, settle } from '../lib/anim';
import { captions } from '../copy/sk';
import { BRAND, FONT, INK } from '../theme';

/** C7 - Pilot: jedna zatvorena krabica, QR doskoci, ikony 1-2-3. 7 s. */
export const C7_Pilot: React.FC = () => {
  const frame = useCurrentFrame();
  const showCap = useCaptions();
  const box = settle(frame, 300);
  const qr = pop(frame, 1300);
  const steps = [pop(frame, 3200), pop(frame, 3600), pop(frame, 4000)];
  const Step: React.FC<{ n: number; t: number; x: number; children: React.ReactNode }> = ({ n, t, x, children }) => (
    <div style={{ position: 'absolute', left: x, top: 640, width: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: Math.min(1, t * 1.4), transform: `translateY(${(1 - t) * 24}px)` }}>
      <div style={{ width: 52, height: 52, borderRadius: 26, background: BRAND[600], color: '#fff', fontFamily: FONT.display, fontWeight: 800, fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</div>
      {children}
    </div>
  );
  return (
    <Scene mode="light">
      <div style={{ position: 'absolute', left: 580, top: -70, opacity: box, transform: `translateY(${(1 - box) * 30}px)` }}>
        <ArchiveBox state={{ lid: 0, binders: [0, 0, 0], qr: [0, 0, 0, qr] }} size={760} />
      </div>
      <Step n={1} t={steps[0]} x={520}>
        <svg width={80} height={80} viewBox="0 0 24 24" fill="none" stroke={INK[700]} strokeWidth={1.6} strokeLinecap="round">
          <circle cx={10.5} cy={10.5} r={6.5} />
          <path d="M15.5 15.5 L21 21" />
        </svg>
      </Step>
      <Step n={2} t={steps[1]} x={850}>
        <div style={{ transform: 'rotate(-4deg)' }}>
          <Sheet w={62} h={80} lines={4} qr />
        </div>
      </Step>
      <Step n={3} t={steps[2]} x={1180}>
        <div style={{ transform: 'rotate(3deg)' }}>
          <Sheet w={62} h={80} lines={5} stamp />
        </div>
      </Step>
      {showCap ? <Caption text={captions.C7} t={settle(frame, 1900)} y={920} /> : null}
    </Scene>
  );
};
