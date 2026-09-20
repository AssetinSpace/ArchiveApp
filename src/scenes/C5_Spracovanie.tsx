import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene, useCaptions } from '../components/Scene';
import { Caption } from '../components/Text';
import { Check, Chip, PhotoCard } from '../components/Illustrations';
import { WindowFrame } from '../components/Device';
import { pop, settle, tween } from '../lib/anim';
import { captions, sk } from '../copy/sk';
import { BRAND, INK } from '../theme';

/**
 * C5 - Spracovanie a potvrdenie v jednom zabere. Fotka v strede-vlavo,
 * OCR riadky vychadzaju, chipy "navrh"; potom potvrdenie (check / oprava),
 * badge -> overene. Zaver: okolo chipov sa vykresli okno aplikacie a
 * najde na cely frame = strih na footage. 14 s.
 *
 * ms: 500 fotka · 1400 OCR · 3000 chipy · 4000 caption a · 8300 out ·
 * 5800+i*700 akcie · 6300+i*700 rozhodnutie · 9800 caption b · 12300 out ·
 * 11600 okno · 12300-13400 najazd.
 */
const OCR = ['ZMENA STAVBY PRED DOKONČENÍM', 'BYTOVÝ DOM SLNEČNÁ 12', 'ATELIÉR PROJEKT, s. r. o.', 'REALIZAČNÝ PROJEKT · 2016', 'ČASŤ E 1-24 · PODORYSY'];
const chips = sk.S06.chips;
const WIN = { x: 900, y: 150, w: 760, h: 620 };

const Actions: React.FC<{ t: number; active: 'ok' | 'edit' }> = ({ t, active }) => (
  <div style={{ display: 'flex', gap: 8, opacity: t, transform: `scale(${0.7 + 0.3 * t})` }}>
    {[
      ['✓', BRAND[100], BRAND[800]],
      ['✎', '#FEF3C7', '#92400E'],
      ['✕', '#FEE2E2', '#991B1B'],
    ].map(([g, bg, fg], i) => {
      const on = (active === 'ok' && i === 0) || (active === 'edit' && i === 1);
      return (
        <div key={i} style={{ width: 44, height: 44, borderRadius: 8, background: on ? fg : bg, color: on ? '#fff' : fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700 }}>
          {g}
        </div>
      );
    })}
  </div>
);

export const C5_Spracovanie: React.FC = () => {
  const frame = useCurrentFrame();
  const showCap = useCaptions();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const photo = settle(frame, 500);
  const decideAt = (i: number) => 6300 + i * 700;
  const fixT = tw(decideAt(2), 400);
  const chrome = tw(11600, 500);
  const fill = tw(12300, 1100);
  const others = 1 - tw(12300, 600);

  return (
    <Scene mode="light">
      <div style={{ position: 'absolute', inset: 0, opacity: others }}>
        <div style={{ position: 'absolute', left: 300, top: 190 }}>
          <PhotoCard w={400} h={520} t={photo} />
          {OCR.map((line, i) => {
            const t = tw(1400 + i * 160, 700);
            const fade = 1 - tw(2900 + i * 60, 400);
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 300 + t * 220,
                  top: 90 + i * 70,
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
        {/* spojnice fotka -> okno */}
        <svg width={220} height={600} style={{ position: 'absolute', left: 700, top: 190, opacity: settle(frame, 5200) }}>
          <path d="M0 260 C 90 260, 90 120, 200 120" fill="none" stroke={INK[300]} strokeWidth={2.5} strokeDasharray="6 6" />
          <path d="M0 260 C 90 260, 90 400, 200 400" fill="none" stroke={INK[300]} strokeWidth={2.5} strokeDasharray="6 6" />
        </svg>
      </div>

      <WindowFrame at={WIN} fill={fill} chrome={chrome}>
        <div style={{ position: 'absolute', left: 40, top: 30, display: 'flex', flexDirection: 'column', gap: 16, transform: `scale(${1 + 0.55 * fill})`, transformOrigin: '0 0' }}>
          {chips.map(([label, value], i) => {
            const act = pop(frame, 5800 + i * 700);
            const decided = tw(decideAt(i), 300);
            const isEdit = i === 2;
            const shown = isEdit && fixT > 0.5 ? sk.S07.fix[1] : value;
            return (
              <Chip
                key={i}
                label={label}
                value={
                  isEdit && fixT > 0 && fixT < 1 ? (
                    <span>
                      <span style={{ textDecoration: 'line-through', color: INK[400], opacity: 1 - fixT }}>{sk.S07.fix[0]}</span>{' '}
                      <span style={{ opacity: fixT, color: BRAND[700] }}>{sk.S07.fix[1]}</span>
                    </span>
                  ) : (
                    shown
                  )
                }
                badge={decided > 0.5 ? sk.S07.badgeOk : sk.S06.badge}
                badgeColor={decided > 0.5 ? 'green' : 'amber'}
                highlight={decided > 0.5}
                t={settle(frame, 3000 + i * 200)}
                width={680}
                right={<Actions t={act * (1 - decided)} active={isEdit ? 'edit' : 'ok'} />}
              />
            );
          })}
        </div>
        <svg width={100} height={100} viewBox="-50 -50 100 100" style={{ position: 'absolute', left: 620, top: 480 }}>
          <Check x={0} y={0} r={36} s={pop(frame, decideAt(3) + 500) * (1 - fill)} />
        </svg>
      </WindowFrame>

      {showCap ? (
        <>
          <Caption text={captions.C5a} t={settle(frame, 4000)} out={tw(8300, 300)} />
          <Caption text={captions.C5b} t={settle(frame, 9800)} out={tw(12300, 300)} />
        </>
      ) : null}
    </Scene>
  );
};
