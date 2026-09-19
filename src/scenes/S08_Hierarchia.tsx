import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene } from '../components/Scene';
import { TextColumn } from '../components/Text';
import { Binder, Carton, IsoBox, Pallet, QrOnLeftFace } from '../lib/iso';
import { drawProps, pop, settle, tween } from '../lib/anim';
import { sk } from '../copy/sk';
import { BRAND, FONT, INK, ISO } from '../theme';

/**
 * S08 - Hierarchia: paleta -> krabica -> zlozka -> dokument sa vybuduje
 * zhora nadol, na kazdom uzle doskoci QR, potom sa jedna vetva "rozsvieti"
 * po skene. 8 s.
 */
const T = sk.S08;

export const S08_Hierarchia: React.FC = () => {
  const frame = useCurrentFrame();
  const lvl = (i: number) => settle(frame, 900 + i * 500);
  const line = (i: number) => tween(frame, 1200 + i * 500, 400);
  const qr = (i: number) => pop(frame, 3200 + i * 220);
  const scan = tween(frame, 4600, 600);
  const glow = tween(frame, 5100, 500);

  const nodes = [
    { x: 400, y: 70 },
    { x: 400, y: 260 },
    { x: 400, y: 450 },
    { x: 400, y: 640 },
  ];
  const siblings = [
    [],
    [-190, 190],
    [-190, 190],
    [-190, 190],
  ];

  const Node: React.FC<{ level: number; x: number; y: number; main?: boolean; t: number; q: number }> = ({ level, x, y, main, t, q }) => {
    const dim = main ? 1 : 0.55 + 0.45 * (1 - glow);
    return (
      <g transform={`translate(${x} ${y}) translate(0 ${(1 - t) * -20})`} opacity={t * dim}>
        {main && glow > 0 ? <circle cx={0} cy={40} r={80 * glow} fill={BRAND[100]} opacity={0.9} /> : null}
        <g transform="translate(0 20)">
          {level === 0 ? (
            <g>
              <Pallet x={-40} y={-40} w={80} d={80} />
              <Carton x={-34} y={-34} z={14} w={34} d={34} h={26} />
              <Carton x={2} y={-34} z={14} w={34} d={34} h={26} />
              <Carton x={-34} y={2} z={14} w={34} d={34} h={26} />
              <Carton x={2} y={2} z={14} w={34} d={34} h={26} />
              <QrOnLeftFace x={-20} y={40} z={-4} size={22} s={q} />
            </g>
          ) : level === 1 ? (
            <g>
              <Carton x={-26} y={-26} z={0} w={52} d={52} h={40} />
              <QrOnLeftFace x={-10} y={26} z={10} size={20} s={q} />
            </g>
          ) : level === 2 ? (
            <g>
              <Binder x={-18} y={-4} z={0} w={36} d={9} h={50} />
              <QrOnLeftFace x={-9} y={5} z={18} size={16} s={q} />
            </g>
          ) : (
            <g>
              <IsoBox x={-22} y={-14} z={0} w={44} d={30} h={3} faces={{ top: '#fff', left: ISO.right, right: ISO.edge }} />
              <QrOnLeftFace x={-8} y={16} z={-4} size={12} s={q} />
            </g>
          )}
        </g>
      </g>
    );
  };

  return (
    <Scene mode="light">
      <TextColumn kicker={T.kicker} lines={T.h} body={T.p} tKicker={settle(frame, 0)} tLines={[settle(frame, 150), settle(frame, 280)]} tBody={settle(frame, 600)} width={800} headlineSize={54} top={130} />
      <svg width={900} height={860} viewBox="0 0 900 860" style={{ position: 'absolute', left: 940, top: 90 }}>
        {/* spojnice */}
        {nodes.slice(1).map((n, i) => {
          const p = nodes[i];
          const t = line(i);
          return (
            <g key={i}>
              {[0, ...siblings[i + 1]].map((dx, k) => {
                const d = `M${p.x} ${p.y + 110} C ${p.x} ${p.y + 160}, ${n.x + dx} ${n.y - 40}, ${n.x + dx} ${n.y + 10}`;
                const strong = dx === 0;
                return (
                  <path
                    key={k}
                    d={d}
                    fill="none"
                    stroke={strong && glow > 0.5 ? BRAND[600] : INK[300]}
                    strokeWidth={strong ? 3 : 2}
                    strokeLinecap="round"
                    opacity={strong ? 1 : 0.6 * (1 - 0.6 * glow)}
                    {...drawProps(t, 400)}
                  />
                );
              })}
            </g>
          );
        })}
        {/* uzly */}
        {nodes.map((n, i) => (
          <g key={i}>
            {siblings[i].map((dx, k) => (
              <Node key={k} level={i} x={n.x + dx} y={n.y} t={lvl(i)} q={qr(i) * 0.9} />
            ))}
            <Node level={i} x={n.x} y={n.y} main t={lvl(i)} q={qr(i)} />
            <text x={n.x + 300} y={n.y + 70} fontFamily={FONT.body} fontSize={28} fontWeight={600} fill={INK[700]} opacity={lvl(i)}>
              {T.levels[i]}
            </text>
            <text x={n.x + 300} y={n.y + 104} fontFamily="ui-monospace, Menlo, monospace" fontSize={22} fill={INK[500]} opacity={qr(i)}>
              {['PL_01', 'KR_03', 'ZL_12', 'DK_07'][i]}
            </text>
          </g>
        ))}
        {/* sken: mobil pri krabici + ramik */}
        <g transform={`translate(${nodes[1].x - 150} ${nodes[1].y + 30})`} opacity={scan}>
          <rect x={0} y={0} width={54} height={100} rx={10} fill={INK[900]} />
          <rect x={5} y={10} width={44} height={80} rx={4} fill="#fff" />
          <rect x={14} y={30} width={26} height={26} fill="none" stroke={BRAND[600]} strokeWidth={3} />
        </g>
        <rect
          x={nodes[1].x - 60}
          y={nodes[1].y - 20}
          width={120}
          height={130}
          rx={10}
          fill="none"
          stroke={BRAND[600]}
          strokeWidth={4}
          opacity={scan * (1 - glow * 0.5)}
          transform={`translate(${nodes[1].x} ${nodes[1].y + 45}) scale(${1.3 - 0.3 * scan}) translate(${-nodes[1].x} ${-nodes[1].y - 45})`}
        />
      </svg>
    </Scene>
  );
};
