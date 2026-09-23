import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene, useCaptions } from '../components/Scene';
import { Caption } from '../components/Text';
import { ArchiveBox, archiveBoxPxPerCm } from '../components/ArchiveBox';
import { Sheet } from '../components/Illustrations';
import { pop, settle } from '../lib/anim';
import { captions } from '../copy/sk';
import { BRAND, CM, FONT, INK, SAFE } from '../theme';

/** C8 - Pilot: jedna zatvorena krabica, QR doskoci, ikony 1-2-3 v mierke A4. 5 s. */
const BOX = 660;
const PX = archiveBoxPxPerCm(BOX);
const SHEET = { w: CM.sheet.w * PX, h: CM.sheet.h * PX };

export const C8_Pilot: React.FC = () => {
  const frame = useCurrentFrame();
  const showCap = useCaptions();
  const box = settle(frame, 300);
  const qr = pop(frame, 1000);
  const steps = [pop(frame, 2400), pop(frame, 2750), pop(frame, 3100)];
  const rowTop = SAFE.illoBottom - SHEET.h - 10;
  const Step: React.FC<{ n: number; t: number; x: number; children: React.ReactNode }> = ({ n, t, x, children }) => (
    <div style={{ position: 'absolute', left: x, top: rowTop, opacity: Math.min(1, t * 1.4), transform: `translateY(${(1 - t) * 24}px)` }}>
      {children}
      <div style={{ position: 'absolute', left: -22, top: -22, width: 48, height: 48, borderRadius: 24, background: BRAND[600], color: '#fff', fontFamily: FONT.display, fontWeight: 800, fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 4px #fff' }}>{n}</div>
    </div>
  );
  return (
    <Scene mode="light" footer>
      <div style={{ position: 'absolute', left: 960 - BOX / 2, top: -50, opacity: box, transform: `translateY(${(1 - box) * 30}px)` }}>
        <ArchiveBox state={{ lid: 0, binders: [0, 0, 0], qr: [0, 0, 0, qr] }} size={BOX} />
      </div>
      <Step n={1} t={steps[0]} x={560}>
        <div style={{ width: SHEET.w, height: SHEET.h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={SHEET.w * 0.8} height={SHEET.w * 0.8} viewBox="0 0 24 24" fill="none" stroke={INK[700]} strokeWidth={1.6} strokeLinecap="round">
            <circle cx={10.5} cy={10.5} r={6.5} />
            <path d="M15.5 15.5 L21 21" />
          </svg>
        </div>
      </Step>
      <Step n={2} t={steps[1]} x={960 - SHEET.w / 2}>
        <div style={{ transform: 'rotate(-4deg)' }}>
          <Sheet w={SHEET.w} h={SHEET.h} lines={5} qr />
        </div>
      </Step>
      <Step n={3} t={steps[2]} x={1360 - SHEET.w}>
        <div style={{ transform: 'rotate(3deg)' }}>
          <Sheet w={SHEET.w} h={SHEET.h} lines={6} stamp />
        </div>
      </Step>
      {showCap ? <Caption text={captions.C8} t={settle(frame, 1500)} y={SAFE.captionY} /> : null}
    </Scene>
  );
};
