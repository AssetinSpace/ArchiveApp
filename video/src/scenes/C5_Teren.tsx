import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene, useCaptions } from '../components/Scene';
import { Caption } from '../components/Text';
import { ArchiveBox, archiveBoxPxPerCm, QR_SCALE } from '../components/ArchiveBox';
import { FOOTAGE_PHONE, PhoneFrame } from '../components/Device';
import { Camera } from '../lib/camera';
import { pop, settle, tween } from '../lib/anim';
import { captions, phases } from '../copy/sk';
import { BRAND, CM, FONT, INK, ISO, SAFE } from '../theme';

/**
 * C5 - V sklade. Dlazdica z webu ako hrdina; harok nalepiek (A4) a mobil
 * (7x15 cm x1.4) v jednej mierke odvodenej z krabice. QR cierno-biele.
 * Zaver: mobil prejde do ramika footage = strih na footage. 9 s.
 *
 * ms: 300 zatvorena krabica · 900 harok · 1500-2200 nalepka z harku na
 * krabicu (let 700 ms, dosadne sklopena do roviny steny) · 2400 veko +
 * zlozky · 3000/3500/4000 nalepky na zlozky (dolet 3700/4200/4700) · 4600
 * predna zlozka sa vytiahne · 4900 mobil · 5400 ramik na zlozku · 5200 mobil
 * sa priblizi · 5500 blesk · 6000 ID zlozky ako stitok pri ramiku ·
 * 5800-7400 kamera najde na zlozku + mobil · 7600-9100 ostatne vybledne a
 * mobil v skutocnej velkosti prejde do ramika footage (F1) = strih do reality.
 * Krabica vlavo, vpravo kroky (Oznacit / Odfotit / Zaevidovat).
 */
const BOX = 860;
/** Krabica vlavo (vpravo je priestor na kroky), rovnaka poloha na konci C4. */
export const C5_BOX_LEFT = 200;
const PX = archiveBoxPxPerCm(BOX); // ~9.4 px/cm
const SHEET = { w: CM.sheet.w * PX, h: CM.sheet.h * PX };
const PHONE = { w: CM.phone.w * PX * 1.4, h: CM.phone.h * PX * 1.4 };
const PHONE_AT = { x: C5_BOX_LEFT + 1090, y: 400, w: PHONE.w, h: PHONE.h };
/** Kamera na konci: najazd na vytiahnutu zlozku s mobilom. */
const CAM_END = { x: C5_BOX_LEFT + 870 - 960, y: 0, scale: 1.4 };
/** Mobil na konci prejde presne do ramika footage (F1), v suradniciach pred kamerou. */
const PHONE_END = {
  x: (FOOTAGE_PHONE.x - 960) / CAM_END.scale + 960 + CAM_END.x,
  y: (FOOTAGE_PHONE.y - 540) / CAM_END.scale + 540 + CAM_END.y,
  w: FOOTAGE_PHONE.w / CAM_END.scale,
  h: FOOTAGE_PHONE.h / CAM_END.scale,
};
/** Nas pristup v troch krokoch (text vpravo, rovnaky jazyk ako pri footage). */
const STEPS: { from: number; title: string; line?: string }[] = [
  { from: 900, title: 'Fyzické dokumenty' },
  { from: 1200, title: 'Prilepiť QR kód' },
  { from: 4100, title: 'Odfotiť identifikačnú stranu' },
];

export const C5_Teren: React.FC = () => {
  const frame = useCurrentFrame();
  const showCap = useCaptions();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const boxLeft = C5_BOX_LEFT;
  const boxTop = SAFE.illoTop - 40;
  const appear = 1; // krabica je na scene od zaciatku (usadila sa uz na konci C4)
  const sheet = settle(frame, 900);
  // lety nalepiek: z bunky harku (r, c) na ciel v krabici (suradnice viewBox 240); dolet = pop QR
  // skew = sklon plochy, na ktoru nalepka doleta (krabica: prava stena -26,6 stupna; zlozky: predna plocha +26,6 stupna)
  const FLIGHTS = [
    { cell: [0, 0], start: 1500, target: [140.49, 145.75], size: 16, qr: 3, skew: -26.57 },
    { cell: [0, 1], start: 3000, target: [86, 135 - 40], size: 14, qr: 0, skew: 26.57 },
    { cell: [0, 2], start: 3120, target: [114, 121 - 40], size: 14, qr: 1, skew: 26.57 },
    { cell: [0, 3], start: 3240, target: [142, 107 - 40], size: 14, qr: 2, skew: 26.57 },
  ] as const;
  const FLY = 700;
  // nalepena QR sa objavi v okamihu doletu v plnej velkosti (letiaca nalepka ma v tom momente rovnaku velkost aj sklon)
  const qr: [number, number, number, number] = [0, 0, 0, 0];
  FLIGHTS.forEach((f) => (qr[f.qr] = (frame * 1000) / 30 >= f.start + FLY - 1 ? 1 : 0));
  // po nalepeni sa predna zlozka vytiahne z krabice (o dalsich 60 j.) a mobil mieri na jej stitok
  const pull = tw(4100, 500);
  const box = {
    lid: tw(2400, 520),
    binders: [tw(2500, 420) + pull * 0.6, tw(2570, 420), tw(2640, 420)] as [number, number, number],
    qr,
    pull,
  };
  const phone = settle(frame, 4300);
  const approach = tw(4600, 500); // mobil sa priblizi k vytiahnutej zlozke
  const PHONE_NOW = { ...PHONE_AT, x: PHONE_AT.x - 150 * approach, y: PHONE_AT.y + 20 * approach };
  const frameBox = tw(4800, 260);
  const flash = tw(4900, 120) * (1 - tw(5020, 400));
  const idT = pop(frame, 5300);
  // zaver: mobil (v skutocnej velkosti, bez roztiahnutia) prejde do ramika footage, ostatne vybledne
  const move = tw(6800, 1500);
  const others = 1 - tw(6800, 900);
  const PHONE_MOVED = {
    x: PHONE_NOW.x + (PHONE_END.x - PHONE_NOW.x) * move,
    y: PHONE_NOW.y + (PHONE_END.y - PHONE_NOW.y) * move,
    w: PHONE_NOW.w + (PHONE_END.w - PHONE_NOW.w) * move,
    h: PHONE_NOW.h + (PHONE_END.h - PHONE_NOW.h) * move,
  };
  const stepIdx = Math.max(0, STEPS.findIndex((s, i) => frame * 1000 / 30 >= s.from && (i === STEPS.length - 1 || frame * 1000 / 30 < STEPS[i + 1].from)));

  // pozicia bunky harku v px (harok je otoceny o -8 stupnov okolo stredu)
  const sheetLeft = 40,
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
    <Scene mode="light" footer footerOpacity={1 - move}>
      <Camera keys={[{ ms: 5200, x: 0, y: 0, scale: 1 }, { ms: 6600, ...CAM_END }]}>
      <div style={{ position: 'absolute', inset: 0, opacity: others }}>
        {/* harok nalepiek A4: 4 x 5 bielych QR */}
        <div style={{ position: 'absolute', left: sheetLeft + (1 - sheet) * -260, top: sheetTop, opacity: sheet, transform: 'rotate(-8deg)' }}>
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
            size1 = (f.size / 240) * BOX * QR_SCALE;
          const size = size0 + (size1 - size0) * t;
          // dosadnutie: v poslednej tretine letu sa nalepka sklopi do roviny plochy a tien zmizne
          const land = Math.max(0, (t - 0.65) / 0.35);
          return (
            <svg key={i} width={size} height={size} viewBox="0 0 36 36" style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, transform: `rotate(${-8 * (1 - t)}deg) skewY(${f.skew * land}deg)`, filter: `drop-shadow(0 ${4 * (1 - land)}px ${6 * (1 - land)}px rgba(0,0,0,${0.18 * (1 - land)}))` }}>
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

        {/* zeleny ramik "odfotene" okolo celej vytiahnutej zlozky */}
        <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, opacity: Math.max(frameBox, idT), pointerEvents: 'none' }}>
          {(() => {
            // ramik "odfotene" okolo celej vytiahnutej prednej zlozky (nie len QR)
            const cx = boxLeft + ((93 + 78 * pull) / 240) * BOX,
              cy = boxTop + ((146.5 - 40 * box.binders[0] + 34 * pull) / 240) * BOX;
            const w = (50 / 240) * BOX,
              h = (80 / 240) * BOX;
            // ID zlozky ako stitok prilepeny k hornemu pravemu rohu ramika (ide s kamerou, nic ho neprekryva)
            const chipW = 150,
              chipH = 52,
              chipX = cx + w / 2 - chipW,
              chipY = cy - h / 2 - chipH - 10;
            return (
              <g>
                <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} fill="none" stroke={BRAND[600]} strokeWidth={5} rx={6} transform={`translate(${cx} ${cy}) scale(${1.3 - 0.3 * frameBox}) translate(${-cx} ${-cy})`} />
                <g opacity={Math.min(1, idT * 1.5)} transform={`translate(${chipX + chipW / 2} ${chipY + chipH}) scale(${0.7 + 0.3 * idT}) translate(${-(chipX + chipW / 2)} ${-(chipY + chipH)})`}>
                  <rect x={chipX} y={chipY} width={chipW} height={chipH} rx={8} fill={INK[900]} />
                  <text x={chipX + chipW / 2} y={chipY + chipH / 2 + 11} textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize={30} fontWeight={600} letterSpacing="0.04em" fill="#fff">
                    ZL_12
                  </text>
                </g>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* mobil - na konci prejde do ramika footage (F1), bez roztiahnutia cez frame */}
      <div style={{ position: 'absolute', inset: 0, opacity: phone, transform: `translateX(${(1 - phone) * 260}px)` }}>
        <PhoneFrame at={PHONE_MOVED} rotate={(8 - 6 * approach) * (1 - move)}>
          <div style={{ position: 'absolute', inset: 0, background: '#fff' }}>
            <div style={{ position: 'absolute', inset: '18% 12% 22% 12%', opacity: (0.5 + 0.5 * frameBox) * (1 - move) }}>
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
            <div style={{ position: 'absolute', left: '50%', bottom: '5%', width: '18%', aspectRatio: '1', transform: 'translateX(-50%)', borderRadius: '50%', border: `3px solid ${INK[400]}`, opacity: 1 - move }}>
              <div style={{ position: 'absolute', inset: '18%', borderRadius: '50%', background: BRAND[600], opacity: 0.4 + 0.6 * flash }} />
            </div>
          </div>
        </PhoneFrame>
      </div>

      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 60% 45%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 55%)', opacity: flash, pointerEvents: 'none' }} />
      </Camera>

      {/* kroky vpravo: nas pristup (rovnaky jazyk ako pri footage); mimo kamery, nehybe sa pri najazde */}
      <div style={{ position: 'absolute', left: 1380, top: 0, width: 500, height: 1080, display: 'flex', flexDirection: 'column', justifyContent: 'center', opacity: others }}>
        {STEPS.map((s, i) => {
          const on = i === stepIdx ? 1 : 0;
          const inT = settle(frame, s.from);
          return (
            <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: 320, opacity: on * inT, transform: `translateY(${(1 - inT) * 16}px)` }}>
              <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 22, letterSpacing: '0.14em', textTransform: 'uppercase', color: BRAND[600], marginBottom: 14 }}>
                {phases.teren}
              </div>
              <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 56, lineHeight: 1.05, color: INK[900], letterSpacing: '-0.02em', marginBottom: 14 }}>{s.title}</div>
              {s.line ? <div style={{ fontFamily: FONT.body, fontWeight: 400, fontSize: 30, lineHeight: 1.35, color: INK[500] }}>{s.line}</div> : null}
              <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
                {STEPS.map((_, k) => (
                  <div key={k} style={{ width: k <= i ? 34 : 12, height: 12, borderRadius: 6, background: k <= i ? BRAND[500] : INK[200] }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>


    </Scene>
  );
};
