import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene } from '../../components/Scene';
import { TextColumn } from '../../components/Text';
import { PriceTag, Sheet } from '../../components/Illustrations';
import { linear, pop, settle, tween } from '../../lib/anim';
import { sk } from '../../copy/sk';
import { BRAND, FONT, INK, NAVY } from '../../theme';

/**
 * S04 - Doterajsie pokusy: Excel zostarne (riadky sedivu, kalendar bezi),
 * skener s nekonecnou kopkou a cenovkou. 6 s. Volitelna scena.
 */
const T = sk.S04;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MÁJ', 'JÚN', 'JÚL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEC'];

export const S04_Pokusy: React.FC = () => {
  const frame = useCurrentFrame();
  const cardA = settle(frame, 800);
  const cardB = settle(frame, 1300);
  const age = linear(frame, 1600, 3000);
  const month = Math.min(11, Math.floor(age * 12));
  const scan = linear(frame, 1800, 3600);
  const tag = pop(frame, 3800);

  const Card: React.FC<{ t: number; text: string; children: React.ReactNode }> = ({ t, text, children }) => (
    <div
      style={{
        width: 400,
        height: 560,
        borderRadius: 16,
        background: 'rgba(255,255,255,0.05)',
        border: `1.5px solid ${NAVY[700]}`,
        position: 'relative',
        opacity: t,
        transform: `translateY(${(1 - t) * 30}px)`,
        overflow: 'hidden',
      }}
    >
      {children}
      <div style={{ position: 'absolute', left: 26, right: 26, bottom: 24, fontFamily: FONT.body, fontSize: 24, color: NAVY[200], lineHeight: 1.35 }}>{text}</div>
    </div>
  );

  return (
    <Scene mode="dark">
      <TextColumn mode="dark" kicker={T.kicker} lines={T.h} tKicker={settle(frame, 0)} tLines={[settle(frame, 150), settle(frame, 280)]} width={800} headlineSize={54} />
      <div style={{ position: 'absolute', left: 960, top: 160, display: 'flex', gap: 40 }}>
        <Card t={cardA} text={T.a}>
          {/* tabulka */}
          <div style={{ position: 'absolute', left: 26, top: 26, width: 230, borderRadius: 8, overflow: 'hidden', border: `1px solid ${INK[300]}`, background: '#fff' }}>
            <div style={{ display: 'flex', background: BRAND[100], height: 30 }}>
              {[0, 1].map((c) => (
                <div key={c} style={{ flex: 1, borderRight: `1px solid ${INK[200]}` }} />
              ))}
            </div>
            {Array.from({ length: 8 }).map((_, r) => {
              const stale = age * 8 > r + 0.5;
              return (
                <div key={r} style={{ display: 'flex', height: 30, borderTop: `1px solid ${INK[200]}`, background: stale ? '#FEF3C7' : '#fff' }}>
                  {[0, 1].map((c) => (
                    <div key={c} style={{ flex: 1, padding: '9px 8px', borderRight: `1px solid ${INK[200]}` }}>
                      <div style={{ height: 10, borderRadius: 3, background: stale ? INK[300] : INK[500], width: `${60 + ((r * 7 + c * 13) % 35)}%` }} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          {/* kalendar */}
          <div style={{ position: 'absolute', right: 26, top: 26, width: 110, borderRadius: 10, overflow: 'hidden', border: `2px solid ${INK[200]}`, background: '#fff', textAlign: 'center' }}>
            <div style={{ background: BRAND[600], color: '#fff', fontFamily: FONT.body, fontWeight: 600, fontSize: 18, padding: '4px 0' }}>{MONTHS[month]}</div>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 40, color: INK[900], padding: '4px 0 8px' }}>{1 + ((month * 7) % 28)}</div>
          </div>
        </Card>
        <Card t={cardB} text={T.b}>
          {/* skener: kopka papierov vstupuje, jeden list vychadza */}
          <div style={{ position: 'absolute', left: 40, top: 40 }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} style={{ position: 'absolute', left: i * 3, top: 200 - i * 7 - scan * 60, opacity: 1 }}>
                <Sheet w={120} h={60} lines={0} title={false} />
              </div>
            ))}
          </div>
          <div style={{ position: 'absolute', left: 180, top: 150, width: 190, height: 110, borderRadius: 12, background: INK[300], border: `2px solid ${INK[400]}` }}>
            <div style={{ position: 'absolute', left: 14, top: 18, width: 162, height: 8, background: BRAND[600], opacity: 0.4 + 0.6 * Math.abs(Math.sin(frame / 4)) }} />
          </div>
          <div style={{ position: 'absolute', left: 300, top: 70 + (1 - tween(frame, 2600, 1200)) * 60, opacity: tween(frame, 2600, 600) }}>
            <Sheet w={90} h={120} lines={4} />
          </div>
          <div style={{ position: 'absolute', left: 26, top: 330 }}>
            <PriceTag text="rádovo viac" s={tag} color={BRAND[700]} />
          </div>
        </Card>
      </div>
    </Scene>
  );
};
