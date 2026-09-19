import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene } from '../components/Scene';
import { TextColumn } from '../components/Text';
import { Carton, Pallet, ShelfFrame } from '../lib/iso';
import { iso } from '../lib/iso';
import { Floor, Person, QuestionMark } from '../components/Illustrations';
import { pop, settle, tween } from '../lib/anim';
import { sk } from '../copy/sk';
import { BRAND } from '../theme';

/**
 * S01 - Sklad. Tri regaly s neoznacenymi krabicami a palety; postavicka
 * klucuje ulickou (bodkovana cesta sa kresli), nad krabicami blikaju "?".
 * Casova os: 0 text; 600 sklad (stagger); 1600-7500 chodza; od 2600 otazniky.
 */
const T = sk.S01;

// cesta postavicky v iso suradniciach (x,y na podlahe)
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

export const S01_Sklad: React.FC = () => {
  const frame = useCurrentFrame();
  const walk = tween(frame, 1600, 5900, (t) => t);
  const appear = settle(frame, 600);

  // poloha postavicky po lomenej ciare
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
    [120, 60, 2600, 0],
    [200, 60, 3300, 40],
    [140, 220, 4000, 0],
    [280, 60, 4600, 80],
    [220, 220, 5300, 0],
    [130, 310, 6000, 0],
  ];

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
      <svg
        width={1000}
        height={675}
        viewBox="-400 -120 800 540"
        style={{ position: 'absolute', left: 880, top: 170, opacity: appear, transform: `translateY(${(1 - appear) * 30}px)` }}
      >
        <Floor x={0} y={0} w={380} d={380} fill="#263246" edge="#131F31" />
        {shelves.map((s, i) => {
          const t = settle(frame, 800 + i * 140);
          return (
            <g key={i} transform={`translate(0 ${(1 - t) * -30})`} opacity={t}>
              <ShelfFrame x={s.x} y={s.y} w={70} d={40} levels={2} levelH={44} />
              {[0, 1].map((lvl) =>
                [0, 1].map((k) => <Carton key={`${lvl}${k}`} x={s.x + 6 + k * 32} y={s.y + 6} z={lvl * 44 + 5} w={26} d={28} h={26} />),
              )}
            </g>
          );
        })}
        {pallets.map((p, i) => {
          const t = settle(frame, 1200 + i * 140);
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
        {/* cesta - kresli sa len prejdena cast lomenej ciary */}
        <path
          d={pathD}
          fill="none"
          stroke={BRAND[300]}
          strokeWidth={2.4}
          strokeDasharray="6 8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.9}
        />
        <Person x={sx} y={sy} scale={0.75} color="#ffffff" opacity={tween(frame, 1500, 300)} />
        {qm.map(([x, y, start, z], i) => {
          const s = pop(frame, start);
          const [qx, qy] = iso(x, y, 120 + z);
          return <QuestionMark key={i} x={qx} y={qy} s={s} />;
        })}
      </svg>
    </Scene>
  );
};
