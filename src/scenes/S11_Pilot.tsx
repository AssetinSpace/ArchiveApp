import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene } from '../components/Scene';
import { TextColumn } from '../components/Text';
import { ArchiveBox } from '../components/ArchiveBox';
import { Sheet } from '../components/Illustrations';
import { pop, settle } from '../lib/anim';
import { sk } from '../copy/sk';
import { BRAND, FONT, INK } from '../theme';

/** S11 - Pilot: tri kroky + jedna krabica so zelenym QR. 6 s. */
const T = sk.S11;

export const S11_Pilot: React.FC = () => {
  const frame = useCurrentFrame();
  const box = settle(frame, 500);
  const qr = pop(frame, 1400);
  return (
    <Scene mode="light">
      <TextColumn kicker={T.kicker} lines={T.h} tKicker={settle(frame, 0)} tLines={[settle(frame, 150)]} width={1000} headlineSize={84} top={130} />
      <div style={{ position: 'absolute', left: 120, top: 440, display: 'flex', gap: 60 }}>
        {T.steps.map(([title, text], i) => {
          const t = settle(frame, 1800 + i * 450);
          return (
            <div key={i} style={{ width: 340, opacity: t, transform: `translateY(${(1 - t) * 26}px)` }}>
              <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 56, color: BRAND[600], lineHeight: 1 }}>{i + 1}</div>
              <div style={{ width: 60, height: 4, background: BRAND[600], margin: '18px 0 22px', borderRadius: 2 }} />
              <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 32, color: INK[900] }}>{title}</div>
              <div style={{ fontFamily: FONT.body, fontSize: 25, color: INK[700], marginTop: 10, lineHeight: 1.4 }}>{text}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', left: 1280, top: 90, opacity: box, transform: `translateY(${(1 - box) * 30}px)` }}>
        <ArchiveBox state={{ lid: 0, binders: [0, 0, 0], qr: [0, 0, 0, qr] }} size={620} />
      </div>
      {/* ikony krokov pod krabicou: lupa, krabica (hore), ponuka */}
      <div style={{ position: 'absolute', left: 1330, top: 720, display: 'flex', gap: 90, alignItems: 'flex-end' }}>
        <svg width={90} height={90} viewBox="0 0 24 24" fill="none" stroke={INK[700]} strokeWidth={1.6} strokeLinecap="round" style={{ opacity: settle(frame, 1800) }}>
          <circle cx={10.5} cy={10.5} r={6.5} />
          <path d="M15.5 15.5 L21 21" />
        </svg>
        <div style={{ opacity: settle(frame, 2250), transform: 'rotate(-4deg)' }}>
          <Sheet w={70} h={92} lines={4} qr />
        </div>
        <div style={{ opacity: settle(frame, 2700), transform: 'rotate(3deg)' }}>
          <Sheet w={70} h={92} lines={5} stamp />
        </div>
      </div>
    </Scene>
  );
};
