import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene, useCaptions } from '../components/Scene';
import { Caption } from '../components/Text';
import { Camera } from '../lib/camera';
import { ArchiveBox } from '../components/ArchiveBox';
import { Carton, Pallet, ShelfFrame, iso } from '../lib/iso';
import { Floor, Person, QuestionMark } from '../components/Illustrations';
import { pop, settle, tween } from '../lib/anim';
import { captions } from '../copy/sk';
import { BRAND, CM, FONT, NAVY, SAFE, ms } from '../theme';

/**
 * C3 - Sklad -> krabica. Siroky zaber (regaly, palety, postavicka kluckuje,
 * "?"), kamera najde (2.6x) k jednej krabici na palete, sklad uplne
 * vybledne, krabica sa otvori a zlozky sa striedavo dvihaju, pocitadlo. 14 s.
 * Mierka 2 px/cm (viewBox 960 x 540 cm), po najazde 5.2 px/cm.
 */
const PATH: [number, number][] = [
  [40, 420],
  [80, 340],
  [80, 180],
  [200, 180],
  [200, 300],
  [330, 300],
  [330, 140],
  [420, 140],
];
const SV = 1.7;
const VB = { x: -565, y: -100 };
const toScreen = (p: [number, number]): [number, number] => [(p[0] - VB.x) * SV, (p[1] - VB.y) * SV];
const PALLETS = [
  { x: 110, y: 230 },
  { x: 250, y: 230 },
  { x: 110, y: 330 },
];
const SHELVES = [
  { x: 100, y: 40 },
  { x: 240, y: 40 },
  { x: 380, y: 40 },
];
// cielova krabica: horna krabica na palete 3
const TP = PALLETS[2];
const TARGET = toScreen(iso(TP.x + 34 + CM.carton.w / 2, TP.y + 22 + CM.carton.d / 2, 14 + CM.carton.h + CM.carton.h / 2));
const ZOOM = 2.6;
const CYCLE = 900;

export const C3_Sklad: React.FC = () => {
  const frame = useCurrentFrame();
  const showCap = useCaptions();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const appear = settle(frame, 400);
  const walk = tw(1500, 5000);
  const seg = Math.min(PATH.length - 2, Math.floor(walk * (PATH.length - 1)));
  const lt = walk * (PATH.length - 1) - seg;
  const px = PATH[seg][0] + (PATH[seg + 1][0] - PATH[seg][0]) * lt;
  const py = PATH[seg][1] + (PATH[seg + 1][1] - PATH[seg][1]) * lt;
  const [sx, sy] = iso(px, py, 0);
  const walked: [number, number][] = [...PATH.slice(0, seg + 1), [px, py]];
  const pathD = walked.map(([x, y], i) => `${i ? 'L' : 'M'}${iso(x, y, 0).join(' ')}`).join(' ');
  const qm: [number, number, number, number][] = [
    [140, 60, 2400, 0],
    [280, 60, 3000, 40],
    [160, 250, 3600, 0],
    [420, 60, 4200, 80],
    [300, 250, 4800, 0],
    [150, 350, 5400, 0],
  ];
  const fadeOut = 1 - tw(7300, 500); // sklad zmizne pred krabicou
  const boxIn = tw(7600, 500);
  const open = tw(8600, 520);
  const start = 9600;
  const elapsed = Math.max(0, frame - ms(start));
  const cycleF = ms(CYCLE);
  const n = Math.floor(elapsed / cycleF);
  const phase = (elapsed % cycleF) / cycleF;
  const lift = phase < 0.5 ? tween(phase * cycleF, 0, CYCLE * 0.4) : 1 - tween((phase - 0.5) * cycleF, 0, CYCLE * 0.4);
  const binders: [number, number, number] = [0, 0, 0];
  if (frame >= ms(start)) binders[n % 3] = lift;
  const count = frame >= ms(start) ? n + (phase > 0.5 ? 1 : 0) : 0;

  const Stack: React.FC<{ x: number; y: number }> = ({ x, y }) => (
    <g>
      <Pallet x={x} y={y} />
      <Carton x={x + 6} y={y + 4} z={14} />
      <Carton x={x + 62} y={y + 4} z={14} />
      <Carton x={x + 6} y={y + 42} z={14} />
      <Carton x={x + 62} y={y + 42} z={14} />
      <Carton x={x + 34} y={y + 22} z={14 + CM.carton.h} />
    </g>
  );

  return (
    <Scene mode="dark">
      <Camera keys={[{ ms: 6000, x: 0, y: 0, scale: 1 }, { ms: 8200, x: TARGET[0] - 960, y: TARGET[1] - 540, scale: ZOOM }]}>
        <svg width={1920} height={1080} viewBox={`${VB.x} ${VB.y} ${1920 / SV} ${1080 / SV}`} style={{ position: 'absolute', left: 0, top: 0, opacity: appear * fadeOut, transform: `translateY(${(1 - appear) * 30}px)` }}>
          <Floor x={-60} y={-60} w={560} d={560} fill="#263246" edge="#131F31" />
          {SHELVES.map((s, i) => {
            const t = settle(frame, 600 + i * 140);
            return (
              <g key={i} transform={`translate(0 ${(1 - t) * -30})`} opacity={t}>
                <ShelfFrame x={s.x} y={s.y} w={CM.shelf.w} d={CM.shelf.d} levels={2} levelH={CM.shelf.level} />
                {[0, 1].map((lvl) => [0, 1].map((k) => <Carton key={`${lvl}${k}`} x={s.x + 8 + k * 60} y={s.y + 12} z={lvl * CM.shelf.level + 5} />))}
              </g>
            );
          })}
          {PALLETS.map((p, i) => {
            const t = settle(frame, 1000 + i * 140);
            return (
              <g key={i} transform={`translate(0 ${(1 - t) * -30})`} opacity={t}>
                <Stack x={p.x} y={p.y} />
              </g>
            );
          })}
          <path d={pathD} fill="none" stroke={BRAND[300]} strokeWidth={2.4} strokeDasharray="6 8" strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
          <Person x={sx} y={sy} scale={1.4} color="#ffffff" opacity={tw(1400, 300) * (1 - tw(6000, 800))} />
          {qm.map(([x, y, s0, z], i) => {
            const s = pop(frame, s0) * (1 - tw(6000, 600));
            const [qx, qy] = iso(x, y, 140 + z);
            return <QuestionMark key={i} x={qx} y={qy} s={s * 1.3} />;
          })}
        </svg>
      </Camera>

      <div style={{ position: 'absolute', left: 560, top: 110, opacity: boxIn, transform: `scale(${0.85 + 0.15 * boxIn})`, transformOrigin: '50% 60%' }}>
        <ArchiveBox state={{ lid: open, binders, qr: [0, 0, 0, 0] }} showQr={false} size={800} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 50, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 18, opacity: tw(9600, 400), fontFamily: FONT.body, color: NAVY[200] }}>
        <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 64, fontWeight: 600, color: '#fff' }}>{String(count).padStart(3, '0')}</span>
        <span style={{ fontSize: 26 }}>z 240 zložiek</span>
      </div>

      {showCap ? (
        <>
          <Caption text={captions.C3a} mode="dark" t={settle(frame, 4000)} out={tw(6300, 300)} y={SAFE.captionY} />
          <Caption text={captions.C3b} mode="dark" t={settle(frame, 11000)} y={SAFE.captionY} />
        </>
      ) : null}
    </Scene>
  );
};
