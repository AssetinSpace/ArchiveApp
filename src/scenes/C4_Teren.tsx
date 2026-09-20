import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene, useCaptions } from '../components/Scene';
import { Caption } from '../components/Text';
import { ArchiveBox, archiveBoxAt } from '../components/ArchiveBox';
import { PhoneFrame } from '../components/Device';
import { pop, settle, tween } from '../lib/anim';
import { captions } from '../copy/sk';
import { BRAND, INK, ISO } from '../theme';

/**
 * C4 - V sklade. Hrdina = dlazdica z webu v strede. Harok nalepiek,
 * mobil odfoti stitok, ID. Zaver: kamera najde do displeja mobilu,
 * displej vyplni frame = strih na footage. 10 s.
 *
 * ms: 600 dlazdica (0.96 s) · 1900 harok · 2800 mobil · 3700 blesk ·
 * 4300 ID · 5000 caption · 7300 caption out · 7600-9300 najazd · hold.
 */
const PHONE = { x: 1400, y: 400, w: 210, h: 420 };

export const C4_Teren: React.FC = () => {
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
  const others = 1 - tw(7600, 900); // ostatne prvky sa stlmia pri najazde

  return (
    <Scene mode="light">
      <div style={{ position: 'absolute', inset: 0, opacity: others }}>
        {/* harok nalepiek */}
        <div style={{ position: 'absolute', left: 300 + (1 - sheet) * -260, top: 470, opacity: sheet, transform: 'rotate(-8deg)' }}>
          <svg width={250} height={326} viewBox="0 0 230 300">
            <rect x={2} y={2} width={226} height={296} rx={6} fill="#fff" stroke={ISO.edge} strokeWidth={2.2} />
            {Array.from({ length: 5 }).map((_, r) =>
              Array.from({ length: 4 }).map((_, c) => {
                const x = 22 + c * 48,
                  y = 26 + r * 52;
                return (
                  <g key={`${r}${c}`}>
                    <rect x={x} y={y} width={36} height={36} fill={BRAND[600]} rx={2} />
                    <rect x={x + 5} y={y + 5} width={9} height={9} fill={ISO.ink} />
                    <rect x={x + 22} y={y + 5} width={9} height={9} fill={ISO.ink} />
                    <rect x={x + 5} y={y + 22} width={9} height={9} fill={ISO.ink} />
                    <rect x={x + 18} y={y + 18} width={6} height={6} fill={ISO.ink} />
                    <rect x={x + 26} y={y + 26} width={5} height={5} fill={ISO.ink} />
                  </g>
                );
              }),
            )}
          </svg>
        </div>

        <ArchiveBox state={box} size={900} style={{ position: 'absolute', left: 510, top: 20 }} />

        {/* ID nad krabicou */}
        <div
          style={{
            position: 'absolute',
            left: 880,
            top: 80,
            padding: '10px 24px',
            borderRadius: 10,
            background: INK[900],
            color: '#fff',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 36,
            fontWeight: 600,
            letterSpacing: '0.04em',
            opacity: Math.min(1, idT * 1.5),
            transform: `translateY(${(1 - idT) * 20}px) scale(${0.7 + 0.3 * idT})`,
          }}
        >
          KR_01
        </div>

        {/* ramik "odfotene" okolo stitku na krabici (QR na krabici) */}
        <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, opacity: frameBox, pointerEvents: 'none' }}>
          <rect
            x={990}
            y={470}
            width={130}
            height={140}
            fill="none"
            stroke={BRAND[600]}
            strokeWidth={5}
            rx={6}
            transform={`translate(1055 540) scale(${1.3 - 0.3 * frameBox}) translate(-1055 -540)`}
          />
        </svg>
      </div>

      {/* mobil (mimo stlmenia - je cielom najazdu) */}
      <div style={{ position: 'absolute', inset: 0, opacity: phone, transform: `translateX(${(1 - phone) * 260 * (1 - fill)}px)` }}>
        <PhoneFrame at={PHONE} fill={fill} rotate={8}>
          {/* obsah displeja: hladacik s ramikom, pri najazde zostane biela plocha */}
          <div style={{ position: 'absolute', inset: 0, background: '#fff' }}>
            <div style={{ position: 'absolute', inset: '18% 12% 22% 12%', opacity: (0.5 + 0.5 * frameBox) * (1 - fill) }}>
              {[
                { left: 0, top: 0, borderLeft: 1, borderTop: 1 },
                { right: 0, top: 0, borderRight: 1, borderTop: 1 },
                { left: 0, bottom: 0, borderLeft: 1, borderBottom: 1 },
                { right: 0, bottom: 0, borderRight: 1, borderBottom: 1 },
              ].map((c, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    width: '22%',
                    height: '18%',
                    left: c.left !== undefined ? 0 : undefined,
                    right: c.right !== undefined ? 0 : undefined,
                    top: c.top !== undefined ? 0 : undefined,
                    bottom: c.bottom !== undefined ? 0 : undefined,
                    borderLeft: c.borderLeft ? `4px solid ${BRAND[600]}` : undefined,
                    borderRight: c.borderRight ? `4px solid ${BRAND[600]}` : undefined,
                    borderTop: c.borderTop ? `4px solid ${BRAND[600]}` : undefined,
                    borderBottom: c.borderBottom ? `4px solid ${BRAND[600]}` : undefined,
                  }}
                />
              ))}
            </div>
            <div style={{ position: 'absolute', left: '50%', bottom: '5%', width: '16%', aspectRatio: '1', transform: 'translateX(-50%)', borderRadius: '50%', border: `4px solid ${INK[400]}`, opacity: 1 - fill }}>
              <div style={{ position: 'absolute', inset: '18%', borderRadius: '50%', background: BRAND[600], opacity: 0.4 + 0.6 * flash }} />
            </div>
          </div>
        </PhoneFrame>
      </div>

      {/* blesk */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 60% 45%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 55%)', opacity: flash, pointerEvents: 'none' }} />

      {showCap ? <Caption text={captions.C4} t={settle(frame, 5000)} out={tw(7300, 300)} y={930} /> : null}
    </Scene>
  );
};
