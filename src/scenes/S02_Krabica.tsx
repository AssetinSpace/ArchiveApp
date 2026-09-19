import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene } from '../components/Scene';
import { TextColumn } from '../components/Text';
import { ArchiveBox } from '../components/ArchiveBox';
import { settle, tween } from '../lib/anim';
import { sk } from '../copy/sk';
import { BRAND, FONT, NAVY, ms } from '../theme';

/**
 * S02 - Jedna krabica, zlozku po zlozke. Veko je otvorene, zlozky sa
 * striedavo dvihaju a vracaju (listovanie), pocitadlo prezretych rastie
 * pomaly; na konci vyskoci citat "je to niekde tam." 7 s.
 */
const T = sk.S02;
const CYCLE = 900; // ms na jednu zlozku

export const S02_Krabica: React.FC = () => {
  const frame = useCurrentFrame();
  const open = tween(frame, 500, 520);
  const start = 1200;
  const elapsed = Math.max(0, frame - ms(start));
  const cycleF = ms(CYCLE);
  const n = Math.floor(elapsed / cycleF);
  const phase = (elapsed % cycleF) / cycleF; // 0..1 v ramci cyklu
  const lift = phase < 0.5 ? tween(phase * cycleF, 0, CYCLE * 0.4) : 1 - tween((phase - 0.5) * cycleF, 0, CYCLE * 0.4);
  const active = n % 3;
  const binders: [number, number, number] = [0, 0, 0];
  if (frame >= ms(start)) binders[active] = lift;
  const count = Math.min(n + (phase > 0.5 ? 1 : 0), 999);
  const quote = settle(frame, 4600);

  return (
    <Scene mode="dark">
      <TextColumn
        mode="dark"
        kicker={T.kicker}
        lines={T.h}
        body={T.p}
        tKicker={settle(frame, 0)}
        tLines={[settle(frame, 150), settle(frame, 280)]}
        tBody={settle(frame, 600)}
        width={800}
        headlineSize={54}
      />
      <div
        style={{
          position: 'absolute',
          left: 120,
          top: 600,
          fontFamily: FONT.display,
          fontWeight: 800,
          fontSize: 76,
          fontStyle: 'italic',
          color: BRAND[300],
          opacity: quote,
          transform: `translateY(${(1 - quote) * 30}px)`,
        }}
      >
        „{T.quote}“
      </div>

      <ArchiveBox
        state={{ lid: open, binders, qr: [0, 0, 0, 0] }}
        showQr={false}
        size={760}
        style={{ position: 'absolute', left: 1020, top: 120, opacity: settle(frame, 300) }}
      />

      {/* pocitadlo */}
      <div
        style={{
          position: 'absolute',
          left: 1120,
          top: 820,
          display: 'flex',
          alignItems: 'baseline',
          gap: 18,
          opacity: tween(frame, 1200, 400),
          fontFamily: FONT.body,
          color: NAVY[200],
        }}
      >
        <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 72, fontWeight: 600, color: '#fff', minWidth: 120, textAlign: 'right' }}>
          {String(count).padStart(3, '0')}
        </span>
        <span style={{ fontSize: 28 }}>{T.counter}</span>
        <span style={{ fontSize: 28, color: NAVY[300], marginLeft: 24 }}>z 240</span>
      </div>
    </Scene>
  );
};
