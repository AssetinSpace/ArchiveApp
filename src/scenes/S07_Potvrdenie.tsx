import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene } from '../components/Scene';
import { TextColumn } from '../components/Text';
import { Check, Chip, PhotoCard } from '../components/Illustrations';
import { pop, settle, tween } from '../lib/anim';
import { sk } from '../copy/sk';
import { BRAND, INK } from '../theme';

/**
 * S07 - Potvrdenie: chipy z S06; pri kazdom sa objavi trojica akcii,
 * "Rok" sa opravi (2016 -> 2018), ostatne dostanu check; badge navrh ->
 * overene. Fotka zostava spojena ciarou. 8 s.
 */
const T = sk.S07;
const chips = sk.S06.chips;

const Actions: React.FC<{ t: number; active?: 'ok' | 'edit' }> = ({ t, active }) => (
  <div style={{ display: 'flex', gap: 8, opacity: t, transform: `scale(${0.7 + 0.3 * t})` }}>
    {[
      ['✓', BRAND[100], BRAND[800]],
      ['✎', '#FEF3C7', '#92400E'],
      ['✕', '#FEE2E2', '#991B1B'],
    ].map(([g, bg, fg], i) => (
      <div
        key={i}
        style={{
          width: 44,
          height: 44,
          borderRadius: 8,
          background: (active === 'ok' && i === 0) || (active === 'edit' && i === 1) ? fg : bg,
          color: (active === 'ok' && i === 0) || (active === 'edit' && i === 1) ? '#fff' : fg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          fontWeight: 700,
        }}
      >
        {g}
      </div>
    ))}
  </div>
);

export const S07_Potvrdenie: React.FC = () => {
  const frame = useCurrentFrame();
  // casova os per chip: akcie 1200 + i*900; rozhodnutie o 500 neskor
  const decideAt = (i: number) => 1700 + i * 900;
  const fixT = tween(frame, decideAt(2), 400);
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
      <div style={{ position: 'absolute', left: 920, top: 200 }}>
        <PhotoCard w={280} h={400} t={settle(frame, 400)} />
      </div>
      {/* spojovacia ciara fotka -> chipy */}
      <svg width={120} height={500} style={{ position: 'absolute', left: 1200, top: 200 }}>
        <path d="M0 200 C 40 200, 40 60, 80 60" fill="none" stroke={INK[300]} strokeWidth={2.5} strokeDasharray="6 6" opacity={settle(frame, 800)} />
        <path d="M0 200 C 40 200, 40 340, 80 340" fill="none" stroke={INK[300]} strokeWidth={2.5} strokeDasharray="6 6" opacity={settle(frame, 800)} />
      </svg>
      <div style={{ position: 'absolute', left: 1240, top: 200, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {chips.map(([label, value], i) => {
          const act = pop(frame, 1200 + i * 900);
          const decided = tween(frame, decideAt(i), 300);
          const isEdit = i === 2;
          const shown = isEdit && fixT > 0.5 ? T.fix[1] : value;
          return (
            <Chip
              key={i}
              label={label}
              value={
                isEdit && fixT > 0 && fixT < 1 ? (
                  <span>
                    <span style={{ textDecoration: 'line-through', color: INK[400], opacity: 1 - fixT }}>{T.fix[0]}</span>{' '}
                    <span style={{ opacity: fixT, color: BRAND[700] }}>{T.fix[1]}</span>
                  </span>
                ) : (
                  shown
                )
              }
              badge={decided > 0.5 ? T.badgeOk : T.badgeDraft}
              badgeColor={decided > 0.5 ? 'green' : 'amber'}
              highlight={decided > 0.5}
              t={settle(frame, 500 + i * 120)}
              width={560}
              right={<Actions t={act * (1 - decided)} active={isEdit ? 'edit' : 'ok'} />}
            />
          );
        })}
      </div>
      {/* velky check na konci */}
      <svg width={120} height={120} viewBox="-60 -60 120 120" style={{ position: 'absolute', left: 1560, top: 660 }}>
        <Check x={0} y={0} r={44} s={pop(frame, decideAt(3) + 500)} />
      </svg>
    </Scene>
  );
};
