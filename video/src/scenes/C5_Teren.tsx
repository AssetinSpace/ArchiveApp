import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene, useCaptions } from '../components/Scene';
import { Caption } from '../components/Text';
import { ArchiveBox, archiveBoxPxPerCm } from '../components/ArchiveBox';
import { PhoneFrame } from '../components/Device';
import { pop, settle, tween } from '../lib/anim';
import { captions } from '../copy/sk';
import { BRAND, CM, INK, ISO, SAFE } from '../theme';

/**
 * C5 - V sklade. Dlazdica z webu ako hrdina; harok nalepiek (A4) a mobil
 * (7x15 cm x1.4) v jednej mierke odvodenej z krabice. QR cierno-biele.
 * Zaver: najazd do displeja mobilu = strih na footage. 10 s.
 *
 * ms: 300 zatvorena krabica · 900 harok · 1500-2000 nalepka z harku na
 * krabicu · 2400 veko + zlozky · 3000/3400/3800 nalepky na zlozky (dolet
 * 3500/3900/4300) · 4600 predna zlozka sa vytiahne · 4900 mobil · 5400 ramik
 * na stitok zlozky · 5500 blesk · 6000 ID zlozky · 7600-9300 najazd = footage
 * (fotenie stitku cez appku).
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
  const boxLeft = 960 - BOX / 2;
  const boxTop = SAFE.illoTop - 40;
  const appear = settle(frame, 300);
  const sheet = settle(frame, 900);
  // lety nalepiek: z bunky harku (r, c) na ciel v krabici (suradnice viewBox 240); dolet = pop QR
  const FLIGHTS = [
    { cell: [0, 0], start: 1500, target: [140.49, 145.75], size: 16, qr: 3 },
    { cell: [0, 1], start: 3000, target: [86, 135 - 40], size: 14, qr: 0 },
    { cell: [0, 2], start: 3400, target: [114, 121 - 40], size: 14, qr: 1 },
    { cell: [0, 3], start: 3800, target: [142, 107 - 40], size: 14, qr: 2 },
  ] as const;
  const FLY = 500;
  const qr: [number, number, number, number] = [0, 0, 0, 0];
  FLIGHTS.forEach((f) => (qr[f.qr] = pop(frame, f.start + FLY)));
  // po nalepeni sa predna zlozka vytiahne z krabice (o dalsich 60 j.) a mobil mieri na jej stitok
  const pull = tw(4600, 500);
  const box = {
    lid: tw(2400, 520),
    binders: [tw(2500, 420) + pull * 0.6, tw(2570, 420), tw(2640, 420)] as [number, number, number],
    qr,
    pull,
  };
  const phone = settle(frame, 4900);
  const frameBox = tw(5400, 260);
  const flash = tw(5500, 120) * (1 - tw(5620, 400));
  const idT = pop(frame, 6000);
  const fill = tw(7600, 1700);
  const others = 1 - tw(7600, 900);

  // pozicia bunky harku v px (harok je otoceny o -8 stupnov okolo stredu)
  const sheetLeft = 330,
    sheetTop = SAFE.illoBottom - SHEET.h - 20,
    sc = SHEET.w / 210,
    ang = (-8 * Math.PI) / 180;
  const cellPx = (r: number, c: number): [number, number] => {
    const lx = (16 + c * 46 + 18) * sc - SHEET.w / 2,
      ly = (24 + r * 52 + 18) * sc - SHEET.h / 2;
    return [sheetLeft + SHEET.w / 2 + lx * Math.cos(ang) - ly * Math.sin(ang), sheetTop + SHEET.h / 2 + lx * Math.sin(ang) + ly * Math.cos(ang)];
  };
  const used = (r: number, c: number) => FLIGHTS.some((f) => f.cell[0] === r && f.cell[1] === c && frame >= (f.start / 1000) * 30);

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
                if (used(r, c)) {
                  return <rect key={`${r}${c}`} x={x} y={y} width={36} height={36} fill="#f3f4f6" stroke={ISO.edge} strokeWidth={0.8} strokeDasharray="3 2" />;
                }
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

        <ArchiveBox state={box} size={BOX} style={{ position: 'absolute', left: boxLeft, top: boxTop, opacity: appear, transform: `translateY(${(1 - appear) * 30}px)` }} />

        {/* letiace nalepky: z harku po obluku na krabicu / zlozky */}
        {FLIGHTS.map((f, i) => {
          const t = tw(f.start, FLY);
          if (t <= 0 || t >= 1) return null;
          const [ax, ay] = cellPx(f.cell[0], f.cell[1]);
          const bx = boxLeft + (f.target[0] / 240) * BOX,
            by = boxTop + (f.target[1] / 240) * BOX;
          const cx = (ax + bx) / 2,
            cy = Math.min(ay, by) - 220;
          const x = (1 - t) * (1 - t) * ax + 2 * (1 - t) * t * cx + t * t * bx;
          const y = (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * cy + t * t * by;
          const size0 = 36 * sc,
            size1 = (f.size / 240) * BOX * 1.1;
          const size = size0 + (size1 - size0) * t;
          return (
            <svg key={i} width={size} height={size} viewBox="0 0 36 36" style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, transform: `rotate(${-8 + 8 * t}deg)`, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.18))' }}>
              <rect x={0.5} y={0.5} width={35} height={35} fill="#fff" stroke={ISO.edge} strokeWidth={0.8} />
              {[
                [4, 4],
                [20, 4],
                [4, 20],
              ].map(([fx, fy], k) => (
                <g key={k}>
                  <rect x={fx} y={fy} width={12} height={12} fill={ISO.ink} />
                  <rect x={fx + 3} y={fy + 3} width={6} height={6} fill="#fff" />
                  <rect x={fx + 4.5} y={fy + 4.5} width={3} height={3} fill={ISO.ink} />
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
              ].map(([dx, dy], k) => (
                <rect key={k} x={dx} y={dy} width={4} height={4} fill={ISO.ink} />
              ))}
            </svg>
          );
        })}

        {/* ID vytiahnutej zlozky hore vpravo vedla krabice (ink, nie zelene) */}
        <div
          style={{
            position: 'absolute',
            left: 1290,
            top: 60,
            padding: '8px 20px',
            borderRadius: 8,
            background: INK[900],
            color: '#fff',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 40,
            fontWeight: 600,
            letterSpacing: '0.04em',
            opacity: Math.min(1, idT * 1.5),
            transform: `translateY(${(1 - idT) * 20}px) scale(${0.7 + 0.3 * idT})`,
          }}
        >
          ZL_12
        </div>

        {/* zeleny ramik "odfotene" okolo QR na vytiahnutej zlozke */}
        <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, opacity: frameBox, pointerEvents: 'none' }}>
          {(() => {
            // ramik "odfotene" okolo QR vytiahnutej prednej zlozky
            const cx = boxLeft + ((86 + 78 * pull) / 240) * BOX,
              cy = boxTop + ((135 - 40 * box.binders[0] + 34 * pull) / 240) * BOX;
            const w = 0.55 * BOX * 0.22,
              h = w * 1.15;
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

      {showCap ? <Caption text={captions.C5} t={settle(frame, 6200)} out={tw(7300, 300)} y={SAFE.captionY} /> : null}
    </Scene>
  );
};
