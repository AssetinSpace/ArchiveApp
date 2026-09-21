import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene, useCaptions } from '../components/Scene';
import { Caption } from '../components/Text';
import { Camera } from '../lib/camera';
import { Binder, Cabinet, Carton, Chair, Desk, IsoBox, Pallet, Roll, ShelfFrame, iso } from '../lib/iso';
import { Floor, Person, QuestionMark } from '../components/Illustrations';
import { pop, settle, tween } from '../lib/anim';
import { captions } from '../copy/sk';
import { BRAND, CM, ISO, SAFE } from '../theme';
import { CAM_END, PALLETS, SEARCH_QMS, SHELF_LEVEL, SHELVES, SV, SearchCarton, TARGET_SHELF, VB, searchBox } from './C3_Sklad';

/**
 * C2 - Hladanie (verzia 2: spojene C2 Kancelaria + C3 Sklad, 11 s).
 * Kancelaria: panacik otvori skrinu, "?", vyleti jeden sanon, odide doprava.
 * Kamera s nim prejde (pan) do skladu: panacik pride k regalu, kamera
 * najde na policu, jedna krabica sa vytiahne, prehlada a vrati; "?" nad
 * regalom = zaciatok C4.
 *
 * ms: 0 kancelaria · 300-1100 panacik ku skrini · 1100-1700 dvere · 1400/1900
 * "?" · 2000 vyhodeny sanon · 2500-3400 panacik odchadza doprava ·
 * 3500-4500 pan do skladu · 4000-5600 chodza k regalu · 4400/5000 "?" ·
 * 5000-6400 kamera na policu, 5600 sklad vybledne · 5600 krabica von ·
 * 6000-9000 otvorit, 3 zlozky, zavriet · 9000-9400 zasunut · 9500 "?".
 */
const PX = 2.4;
const CAB = { x: 280, y: 40 };
const LEVEL = (CM.cabinet.h - 3) / 3;
const PAN_AT = 3500;

const TopLabel: React.FC<{ x: number; y: number; z: number; lines: [string, string] }> = ({ x, y, z, lines }) => {
  const [ox, oy] = iso(x, y, z);
  return (
    <g transform={`matrix(1 0.5 -1 0.5 ${ox} ${oy})`}>
      <rect x={0} y={0} width={22} height={16} rx={1} fill="#fff" stroke={ISO.edge} strokeWidth={0.6} />
      <text x={11} y={6.5} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={4.6} fill={ISO.ink}>
        {lines[0]}
      </text>
      <text x={11} y={13} textAnchor="middle" fontFamily="Inter" fontWeight={600} fontSize={4.2} fill={ISO.edge}>
        {lines[1]}
      </text>
    </g>
  );
};
const Lying: React.FC<{ x: number; y: number; z: number; label?: [string, string] }> = ({ x, y, z, label = ['PROJEKT', '2018'] }) => (
  <g>
    <IsoBox x={x} y={y} z={z} w={CM.binder.w} d={CM.binder.h} h={CM.binder.d} faces={{ top: ISO.paper, left: ISO.paper, right: ISO.right }} stroke />
    <IsoBox x={x + CM.binder.w - 4} y={y} z={z} w={4} d={CM.binder.h} h={CM.binder.d} faces={{ top: ISO.right, left: ISO.right, right: ISO.edge }} />
    <TopLabel x={x + 3} y={y + 12} z={z + CM.binder.d} lines={label} />
  </g>
);
const Papers: React.FC<{ x: number; y: number; z: number; h?: number }> = ({ x, y, z, h = 6 }) => (
  <IsoBox x={x} y={y} z={z} w={21} d={30} h={h} faces={{ top: '#fff', left: ISO.paper, right: ISO.left }} stroke />
);

/** Kancelaria (0-3,9 s): skratena verzia C2. */
const Office: React.FC<{ frame: number }> = ({ frame }) => {
  const tw = (s: number, d: number) => tween(frame, s, d);
  const walk = tw(300, 800);
  const open = tw(1100, 600);
  const leave = tw(2500, 900); // odide doprava von z framu skor, nez zacne pan
  const qmOut = 1 - tw(2400, 300);
  const qm = [pop(frame, 1400) * qmOut, pop(frame, 1900) * qmOut];
  // panacik: ku skrini, potom odchadza doprava (pred skrinou) von z framu
  const atX = CAB.x - 70,
    atY = CAB.y + 70;
  const px = 200 + (atX - 200) * walk + (560 - atX) * leave;
  const py = 260 + (atY - 260) * walk;
  const [sx, sy] = iso(px, py, 0);
  const thrown = tw(2000, 700);
  const tx = CAB.x + 20 + (CAB.x - 30 - (CAB.x + 20)) * thrown,
    ty = CAB.y + 60 + (CAB.y + 100 - (CAB.y + 60)) * thrown,
    tz = 90 * (1 - thrown) + 80 * Math.sin(Math.PI * thrown);
  const [tcx, tcy] = iso(tx + 16, ty + 15, tz);

  return (
    <svg width={1920} height={1080} viewBox="-400 -60 800 450" style={{ position: 'absolute', left: 0, top: 0 }}>
      <Floor x={-40} y={-40} w={520} d={420} fill="#263246" edge="#131F31" />
      <Desk x={40} y={160} />
      <Chair x={90} y={248} />
      <Lying x={60} y={170} z={75} label={['FAKTÚRY', '2021']} />
      <Papers x={104} y={168} z={75} h={5} />
      <Papers x={112} y={186} z={80} h={3} />
      {thrown > 0 ? (
        <g transform={`rotate(${(1 - thrown) * 40} ${tcx} ${tcy})`}>
          <Lying x={tx} y={ty} z={tz} />
        </g>
      ) : null}
      <Cabinet x={CAB.x} y={CAB.y} open={open}>
        {[4, 38, 62].map((bx, i) => (
          <Binder key={`b0${i}`} x={CAB.x + 3 + bx} y={CAB.y + 6 + [0, 10, 2][i]} z={3} d={30} />
        ))}
        <Lying x={CAB.x + 6} y={CAB.y + 6} z={3 + CM.binder.h} label={['ZMLUVY', '2016']} />
        {[4, 60].map((bx, i) => (
          <Binder key={`b1${i}`} x={CAB.x + 3 + bx} y={CAB.y + 6 + [8, 0][i]} z={LEVEL + 3} d={30} />
        ))}
        <Papers x={CAB.x + 40} y={CAB.y + 8} z={LEVEL + 3} h={9} />
        <Lying x={CAB.x + 36} y={CAB.y + 14} z={LEVEL + 12} label={['STAVBA', 'B2']} />
        <Roll x={CAB.x + 6} y={CAB.y + 8} z={2 * LEVEL + 3} len={88} />
        <Roll x={CAB.x + 6} y={CAB.y + 20} z={2 * LEVEL + 3} len={82} />
        <Roll x={CAB.x + 10} y={CAB.y + 14} z={2 * LEVEL + 11} len={84} />
        <Papers x={CAB.x + 62} y={CAB.y + 10} z={2 * LEVEL + 3} h={6} />
      </Cabinet>
      <Person x={sx} y={sy} scale={1.25} color={BRAND[400]} opacity={tw(200, 300)} />
      {qm.map((s, i) => {
        const bob = Math.sin(frame / 10 + i * 2.1) * 3;
        const [qx, qy] = iso(atX - 46 + i * 30 + Math.sin(frame / 14 + i) * 1.5, atY - 4, 130 + (i % 2) * 18 + bob);
        return <QuestionMark key={i} x={qx} y={qy} s={s * 0.7} />;
      })}
    </svg>
  );
};

/** Sklad (od 3,5 s): skratena verzia C3 s jednou prehladanou krabicou. */
const PATH: [number, number][] = [
  [-20, 400],
  [40, 300],
  [40, 140],
  [200, 140],
  [305, 120],
  [305, 138],
];
const Warehouse: React.FC<{ frame: number }> = ({ frame }) => {
  const tw = (s: number, d: number) => tween(frame, s, d);
  const walk = tw(4000, 1600); // panacik vojde do skladu, ked je uz sklad v zabere
  const seg = Math.min(PATH.length - 2, Math.floor(walk * (PATH.length - 1)));
  const lt = walk * (PATH.length - 1) - seg;
  const px = PATH[seg][0] + (PATH[seg + 1][0] - PATH[seg][0]) * lt;
  const py = PATH[seg][1] + (PATH[seg + 1][1] - PATH[seg][1]) * lt;
  const [sx, sy] = iso(px, py, 0);
  const walked: [number, number][] = [...PATH.slice(0, seg + 1), [px, py]];
  const pathD = walked.map(([x, y], i) => `${i ? 'L' : 'M'}${iso(x, y, 0).join(' ')}`).join(' ');
  const qm: [number, number, number, number][] = [
    [140, 60, 4400, 0],
    [420, 60, 5000, 80],
  ];
  const others = 1 - tw(5600, 500);
  const A = searchBox(tw, 6000);
  const qEnd = pop(frame, 9500);
  const qmA = SEARCH_QMS[0];

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
    <Camera keys={[{ ms: 5000, x: 0, y: 0, scale: 1 }, { ms: 6400, ...CAM_END }]}>
      <svg width={1920} height={1080} viewBox={`${VB.x} ${VB.y} ${1920 / SV} ${1080 / SV}`} style={{ position: 'absolute', left: 0, top: 0 }}>
        <g opacity={others}>
          <Floor x={-60} y={-60} w={560} d={560} fill="#263246" edge="#131F31" />
          <path d={pathD} fill="none" stroke={BRAND[300]} strokeWidth={2.4} strokeDasharray="6 8" strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
        </g>
        {SHELVES.map((s, i) => {
          const isTarget = s === TARGET_SHELF;
          return (
            <g key={i} opacity={isTarget ? 1 : others}>
              <ShelfFrame x={s.x} y={s.y} w={CM.shelf.w} d={CM.shelf.d} levels={2} levelH={CM.shelf.level} topBoard={false}>
                {(lvl) =>
                  [0, 1].map((k) => {
                    const cx = s.x + 8 + k * 60,
                      cy = s.y + 12,
                      cz = lvl * CM.shelf.level + 4;
                    if (isTarget && lvl === SHELF_LEVEL && k === 0) {
                      return <SearchCarton key={`${lvl}${k}`} x={cx} y={cy} z={cz} out={A.out} lid={A.lid} binders={A.binders} />;
                    }
                    return <Carton key={`${lvl}${k}`} x={cx} y={cy} z={cz} />;
                  })
                }
              </ShelfFrame>
              {isTarget
                ? (() => {
                    // bublinka "?" pri vytiahnuti prvej zlozky (6500)
                    const ms = 6500;
                    const life = tw(ms, 2000);
                    const fade = 1 - tw(ms + 1600, 400);
                    const [qx, qy] = iso(qmA[0] + Math.sin(life * Math.PI * 2) * 6, qmA[1], qmA[2] + life * 26);
                    return <QuestionMark x={qx} y={qy} s={pop(frame, ms) * 0.55 * fade} />;
                  })()
                : null}
              {isTarget
                ? (() => {
                    const [qx, qy] = iso(s.x + 65 + Math.sin(frame / 9) * 2, s.y + 30, 2 * CM.shelf.level + 14 + Math.sin(frame / 12) * 3);
                    return <QuestionMark x={qx} y={qy} s={qEnd * 0.7} />;
                  })()
                : null}
            </g>
          );
        })}
        <g opacity={others}>
          {PALLETS.map((p, i) => (
            <Stack key={i} x={p.x} y={p.y} />
          ))}
          {qm.map(([x, y, s0, z], i) => {
            const s = pop(frame, s0) * (1 - tw(5300, 500));
            const [qx, qy] = iso(x, y, 140 + z);
            return <QuestionMark key={i} x={qx} y={qy} s={s * 1.8} />;
          })}
        </g>
        <Person x={sx} y={sy} scale={1.4} color={BRAND[400]} opacity={tw(4000, 200) * (1 - tw(5400, 600))} />
      </svg>
    </Camera>
  );
};

export const C2_Hladanie: React.FC = () => {
  const frame = useCurrentFrame();
  const showCap = useCaptions();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const pan = tw(PAN_AT, 1000);

  return (
    <Scene mode="dark">
      {/* pan kamery: kancelaria odide dolava, sklad pride sprava (obe navy, spojite) */}
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${-1920 * pan}px)` }}>
        {pan < 1 ? (
          <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, overflow: 'hidden' }}>
            <Office frame={frame} />
          </div>
        ) : null}
        {pan > 0 ? (
          <div style={{ position: 'absolute', left: 1920, top: 0, width: 1920, height: 1080, overflow: 'hidden' }}>
            <Warehouse frame={frame} />
          </div>
        ) : null}
      </div>
      {showCap ? (
        <>
          <Caption text={captions.C2} mode="dark" t={settle(frame, 1500)} out={tw(3300, 300)} y={SAFE.captionY} />
          <Caption text={captions.C2b} mode="dark" t={settle(frame, 7000)} y={SAFE.captionY} />
        </>
      ) : null}
    </Scene>
  );
};
