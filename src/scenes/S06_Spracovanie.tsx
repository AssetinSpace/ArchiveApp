import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene } from '../components/Scene';
import { TextColumn } from '../components/Text';
import { Chip, PhotoCard } from '../components/Illustrations';
import { settle, tween } from '../lib/anim';
import { sk } from '../copy/sk';
import { BRAND, INK } from '../theme';

/**
 * S06 - Spracovanie: fotka -> riadky OCR textu -> chipy metadat (navrh).
 * Casova os: 0 text; 700 fotka; 1600 OCR riadky vychadzaju; 3000 AI iskra;
 * 3400 chipy (stagger 220); hold. 8 s.
 */
const T = sk.S06;
const OCR = ['ZMENA STAVBY PRED DOKONČENÍM', 'BYTOVÝ DOM SLNEČNÁ 12', 'ATELIÉR PROJEKT, s. r. o.', 'REALIZAČNÝ PROJEKT · 2016', 'ČASŤ E 1-24 · PODORYSY'];

export const S06_Spracovanie: React.FC = () => {
  const frame = useCurrentFrame();
  const photo = settle(frame, 700);
  const spark = settle(frame, 3000);
  return (
    <Scene mode="light">
      <TextColumn
        kicker={T.kicker}
        lines={T.h}
        body={T.p}
        tKicker={settle(frame, 0)}
        tLines={[settle(frame, 150), settle(frame, 280)]}
        tBody={settle(frame, 600)}
        width={800}
        headlineSize={54}
        top={130}
      />
      {/* fotka */}
      <div style={{ position: 'absolute', left: 940, top: 200 }}>
        <PhotoCard w={330} h={430} t={photo} />
        {/* OCR riadky vychadzaju z fotky doprava */}
        {OCR.map((line, i) => {
          const t = tween(frame, 1600 + i * 180, 700);
          const fade = 1 - tween(frame, 3300 + i * 60, 400);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 250 + t * 130,
                top: 60 + i * 66,
                fontFamily: 'ui-monospace, Menlo, monospace',
                fontSize: 22,
                color: INK[700],
                background: '#fff',
                border: `1px solid ${INK[200]}`,
                borderRadius: 6,
                padding: '6px 12px',
                whiteSpace: 'nowrap',
                opacity: t * fade,
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
      {/* AI iskra */}
      <svg width={80} height={80} viewBox="-40 -40 80 80" style={{ position: 'absolute', left: 1190, top: 650, opacity: spark, transform: `scale(${0.5 + 0.5 * spark}) rotate(${frame * 1.2}deg)` }}>
        <path d="M0 -30 L7 -7 L30 0 L7 7 L0 30 L-7 7 L-30 0 L-7 -7 Z" fill={BRAND[600]} />
        <path d="M20 -26 L23 -18 L31 -15 L23 -12 L20 -4 L17 -12 L9 -15 L17 -18 Z" fill={BRAND[400]} />
      </svg>
      {/* chipy */}
      <div style={{ position: 'absolute', left: 1300, top: 200, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {T.chips.map(([label, value], i) => (
          <Chip key={i} label={label} value={value} badge={T.badge} t={settle(frame, 3400 + i * 220)} width={500} />
        ))}
      </div>
    </Scene>
  );
};
