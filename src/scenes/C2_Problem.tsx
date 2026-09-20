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
import { BRAND, FONT, NAVY, ms } from '../theme';

/**
 * C2 - Problem: siroky zaber skladu (postavicka kluckuje, "?" vyskakuju),
 * kamera najde k jednej krabici na palete, krabica sa otvori, zlozky sa
 * striedavo dvihaju (listovanie), pocitadlo bezi. 14 s.
 *
 * ms: 400 sklad · 1500-6500 chodza · 2400+ otazniky · 3000 caption a ·
 * 6300 caption a out · 6000-8200 najazd (scale 2.6) · 7600 krabica
 * (crossfade) · 8600 veko · 9600 listovanie · 11000 caption b.
 */
const PATH: [number, number][] = [
  [30, 300],
  [70, 240],
  [70, 150],
  [150, 150],
  [150, 250],
  [230, 250],
  [230, 120],
  [300, 120],
];
// svg: viewBox -480 -200 960 540 na 1920x1080 => mierka 2
const SV = 2;
const toScreen = (p: [number, number]): [number, number] => [(p[0] + 480) * SV, (p[1] + 200) * SV];
// cielova krabica: horna krabica na palete 3 (110,290)
const TARGET = toScreen(iso(145, 325, 50));
const ZOOM = 2.6;
const CYCLE = 900;

export const C2_Problem: React.FC = () => {
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

  const shelves = [
    { x: 100, y: 40 },
    { x: 180, y: 40 },
    { x: 260, y: 40 },
  ];
  const pallets = [
    { x: 110, y: 200 },
    { x: 190, y: 200 },
    { x: 110, y: 290 },
  ];
  const qm: [number, number, number, number][] = [
    [120, 60, 2400, 0],
    [200, 60, 3000, 40],
    [140, 220, 3600, 0],
    [280, 60, 4200, 80],
    [220, 220, 4800, 0],
    [130, 310, 5400, 0],
  ];

  // krabica: crossfade po dojazde kamery
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

  return (
    <Scene mode="dark">
      <Camera keys={[{ ms: 6000, x: 0, y: 0, scale: 1 }, { ms: 8200, x: TARGET[0] - 960, y: TARGET[1] - 540, scale: ZOOM }]}>
        <svg width={1920} height={1080} viewBox="-480 -200 960 540" style={{ position: 'absolute', left: 0, top: 0, opacity: appear, transform: `translateY(${(1 - appear) * 30}px)` }}>
          <Floor x={-60} y={-60} w={480} d={480} fill="#263246" edge="#131F31" />
          {shelves.map((s, i) => {
            const t = settle(frame, 600 + i * 140);
            return (
              <g key={i} transform={`translate(0 ${(1 - t) * -30})`} opacity={t}>
                <ShelfFrame x={s.x} y={s.y} w={70} d={40} levels={2} levelH={44} />
                {[0, 1].map((lvl) => [0, 1].map((k) => <Carton key={`${lvl}${k}`} x={s.x + 6 + k * 32} y={s.y + 6} z={lvl * 44 + 5} w={26} d={28} h={26} />))}
              </g>
            );
          })}
          {pallets.map((p, i) => {
            const t = settle(frame, 1000 + i * 140);
            return (
              <g key={i} transform={`translate(0 ${(1 - t) * -30})`} opacity={t}>
                <Pallet x={p.x} y={p.y} w={70} d={70} />
                <Carton x={p.x + 4} y={p.y + 4} z={14} w={30} d={30} h={24} />
                <Carton x={p.x + 36} y={p.y + 4} z={14} w={30} d={30} h={24} />
                <Carton x={p.x + 4} y={p.y + 36} z={14} w={30} d={30} h={24} />
                <Carton x={p.x + 36} y={p.y + 36} z={14} w={30} d={30} h={24} />
                <Carton x={p.x + 20} y={p.y + 20} z={38} w={30} d={30} h={24} />
              </g>
            );
          })}
          <path d={pathD} fill="none" stroke={BRAND[300]} strokeWidth={2.4} strokeDasharray="6 8" strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
          <Person x={sx} y={sy} scale={0.75} color="#ffffff" opacity={tw(1400, 300) * (1 - tw(6000, 800))} />
          {qm.map(([x, y, s0, z], i) => {
            const s = pop(frame, s0) * (1 - tw(6000, 600));
            const [qx, qy] = iso(x, y, 120 + z);
            return <QuestionMark key={i} x={qx} y={qy} s={s} />;
          })}
        </svg>
      </Camera>

      {/* krabica v strede po dojazde kamery */}
      <div style={{ position: 'absolute', left: 560, top: 130, opacity: boxIn, transform: `scale(${0.85 + 0.15 * boxIn})`, transformOrigin: '50% 60%' }}>
        <ArchiveBox state={{ lid: open, binders, qr: [0, 0, 0, 0] }} showQr={false} size={800} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 50, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 18, opacity: tw(9600, 400), fontFamily: FONT.body, color: NAVY[200] }}>
        <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 64, fontWeight: 600, color: '#fff' }}>{String(count).padStart(3, '0')}</span>
        <span style={{ fontSize: 26 }}>z 240 zložiek</span>
      </div>

      {showCap ? (
        <>
          <Caption text={captions.C2a} mode="dark" t={settle(frame, 3000)} out={tw(6300, 300)} />
          <Caption text={captions.C2b} mode="dark" t={settle(frame, 11000)} y={930} />
        </>
      ) : null}
    </Scene>
  );
};
