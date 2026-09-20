import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene, useCaptions } from '../components/Scene';
import { Caption } from '../components/Text';
import { ArchiveBox, archiveBoxAt, archiveBoxPxPerCm } from '../components/ArchiveBox';
import { PhoneFrame } from '../components/Device';
import { pop, settle, tween } from '../lib/anim';
import { captions } from '../copy/sk';
import { BRAND, CM, INK, ISO, SAFE } from '../theme';

/**
 * C5 - V sklade. Dlazdica z webu ako hrdina; harok nalepiek (A4) a mobil
 * (7x15 cm x1.4) v jednej mierke odvodenej z krabice. QR cierno-biele.
 * Zaver: najazd do displeja mobilu = strih na footage. 10 s.
 *
 * ms: 600 dlazdica · 1900 harok · 2800 mobil · 3700 blesk · 4300 ID ·
 * 5000 caption · 7300 caption out · 7600-9300 najazd · hold.
 */
const BOX = 860;
const PX = archiveBoxPxPerCm(BOX); // ~9.4 px/cm
const SHEET = { w: CM.sheet.w * PX, h: CM.sheet.h * PX };
const PHONE = { w: CM.phone.w * PX * 1.4, h: CM.phone.h * PX * 1.4 };
const PHONE_AT = { x: 1420, y: 400, w: PHONE.w, h: PHONE.h };

export const C5_Teren: React.FC = () => {
  const frame = useCurrentFrame();
  const showCap = useCaptions();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const box = archiveBoxAt(tw, 600);
  const sheet = settle(frame, 1900);
  const phone = settle(frame, 2800);
  const flash = tw(3700, 120) * (1 - tw(3820, 400));
  const frameBox = tw(3650, 260);
  const idT = pop(frame, 4300);
  const fill = tw(7600, 1700);
  const others = 1 - tw(7600, 900);
  const boxLeft = 960 - BOX / 2;
  const boxTop = SAFE.illoTop - 40;

  return (
    <Scene mode="light">
      <div style={{ position: 'absolute', inset: 0, opacity: others }}>
        {/* harok nalepiek A4: 4 x 5 bielych QR */}
        <div style={{ position: 'absolute', left: 330 + (1 - sheet) * -260, top: SAFE.illoBottom - SHEET.h - 20, opacity: sheet, transform: 'rotate(-8deg)' }}>
          <svg width={SHEET.w} height={SHEET.h} viewBox="0 0 210 300">
            <rect x={1} y={1} width={208} height={298} rx={4} fill="#fff" stroke={ISO.edge} strokeWidth={2} />
            {Array.from({ length: 5 }).map((_, r) =>
              Array.from({ length: 4 }).map((_, c) => {
                const x = 16 + c * 46,
                  y = 24 + r * 52;
                return (
                  <g key={`${r}${c}`}>
                    <rect x={x} y={y} width={36} height={36} fill="#fff" stroke={ISO.edge} strokeWidth={0.8} />
                    {[
                      [4, 4],
                      [20, 4],
                      [4, 20],
                    ].map(([fx, fy], i) => (
                      <g key={i}>
                        <rect x={x + fx} y={y + fy} width={12} height={12} fill={ISO.ink} />
                        <rect x={x + fx + 3} y={y + fy + 3} width={6} height={6} fill="#fff" />
                        <rect x={x + fx + 4.5} y={y + fy + 4.5} width={3} height={3} fill={ISO.ink} />
                      </g>
                    ))}
                    {[
                      [20, 20],
                      [28, 24],
                      [24, 28],
                      [18, 12],
                      [24, 20],
                      [30, 30],
                      [20, 30],
                      [12, 18],
                      [28, 16],
                    ].map(([dx, dy], i) => (
                      <rect key={i} x={x + dx} y={y + dy} width={4} height={4} fill={ISO.ink} />
                    ))}
                  </g>
                );
              }),
            )}
          </svg>
        </div>

        <ArchiveBox state={box} size={BOX} style={{ position: 'absolute', left: boxLeft, top: boxTop }} />

        {/* ID nad krabicou (ink, nie zelene) */}
        <div
          style={{
            position: 'absolute',
            left: 880,
            top: 90,
            padding: '8px 20px',
            borderRadius: 8,
            background: INK[900],
            color: '#fff',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: '0.04em',
            opacity: Math.min(1, idT * 1.5),
            transform: `translateY(${(1 - idT) * 20}px) scale(${0.7 + 0.3 * idT})`,
          }}
        >
          KR_01
        </div>

        {/* zeleny ramik "odfotene" okolo QR na krabici */}
        <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, opacity: frameBox, pointerEvents: 'none' }}>
          {(() => {
            const cx = boxLeft + (140.49 / 240) * BOX,
              cy = boxTop + (145.75 / 240) * BOX;
            const w = 0.55 * BOX * 0.25,
              h = w * 1.1;
            return <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} fill="none" stroke={BRAND[600]} strokeWidth={5} rx={6} transform={`translate(${cx} ${cy}) scale(${1.3 - 0.3 * frameBox}) translate(${-cx} ${-cy})`} />;
          })()}
        </svg>
      </div>

      {/* mobil - ciel najazdu */}
      <div style={{ position: 'absolute', inset: 0, opacity: phone, transform: `translateX(${(1 - phone) * 260 * (1 - fill)}px)` }}>
        <PhoneFrame at={PHONE_AT} fill={fill} rotate={8}>
          <div style={{ position: 'absolute', inset: 0, background: '#fff' }}>
            <div style={{ position: 'absolute', inset: '18% 12% 22% 12%', opacity: (0.5 + 0.5 * frameBox) * (1 - fill) }}>
              {[
                { l: true, t: true },
                { l: false, t: true },
                { l: true, t: false },
                { l: false, t: false },
              ].map((c, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    width: '22%',
                    height: '18%',
                    left: c.l ? 0 : undefined,
                    right: c.l ? undefined : 0,
                    top: c.t ? 0 : undefined,
                    bottom: c.t ? undefined : 0,
                    borderLeft: c.l ? `3px solid ${BRAND[600]}` : undefined,
                    borderRight: c.l ? undefined : `3px solid ${BRAND[600]}`,
                    borderTop: c.t ? `3px solid ${BRAND[600]}` : undefined,
                    borderBottom: c.t ? undefined : `3px solid ${BRAND[600]}`,
                  }}
                />
              ))}
            </div>
            <div style={{ position: 'absolute', left: '50%', bottom: '5%', width: '18%', aspectRatio: '1', transform: 'translateX(-50%)', borderRadius: '50%', border: `3px solid ${INK[400]}`, opacity: 1 - fill }}>
              <div style={{ position: 'absolute', inset: '18%', borderRadius: '50%', background: BRAND[600], opacity: 0.4 + 0.6 * flash }} />
            </div>
          </div>
        </PhoneFrame>
      </div>

      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 60% 45%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 55%)', opacity: flash, pointerEvents: 'none' }} />

      {showCap ? <Caption text={captions.C5} t={settle(frame, 5000)} out={tw(7300, 300)} y={SAFE.captionY} /> : null}
    </Scene>
  );
};
