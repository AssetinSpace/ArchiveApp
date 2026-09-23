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
import { CAM_END, PALLETS, SEARCH_QMS, SHELF_LEVEL, SHELVES, SV, SearchCarton, TARGET_SHELF, VB } from './C3_Sklad';

/**
 * C2 - Hladanie (verzia 2: spojene C2 Kancelaria + C3 Sklad, 11,5 s).
 * Kancelaria: panacik otvori skrinu, vyhodi sanon, rolku a papiere, po
 * kratkej pauze jeden "?", odide doprava. Prestrih: sklad je v suterene -
 * platna s kancelariou sa posunie hore a odhali sklad. Panacik pride k
 * regalu, kamera najde na policu; prva krabica von, veko, vsetky zlozky
 * naraz hore, "?"; druha to iste; velky "?" nad regalom = zaciatok C4.
 *
 * ms: 300-1100 panacik ku skrini · 1100-1700 dvere · 1700/2100/2500
 * vyhodene veci · 3100 "?" · 3600-4400 panacik odchadza · 4500-5600
 * prestrih hore (suteren) · 5200-6500 chodza k regalu · 5500/6000 "?" ·
 * 6000-6900 kamera na policu, 6300 sklad vybledne · 6300-8900 krabica A
 * (von, veko, zlozky naraz, "?", spat) · 8500-11300 krabica B · 11200 "?". 11,5 s.
 */
const PX = 2.4;
const CAB = { x: 280, y: 40 };
const LEVEL = (CM.cabinet.h - 3) / 3;
const PAN_AT = 4500;
const PAN_MS = 1100;

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
  const leave = tw(3600, 800); // odide doprava von z framu skor, nez zacne pan
  const qmOut = 1 - tw(3500, 300);
  const qm = [pop(frame, 3100) * qmOut]; // jeden otaznik po kratkej pauze, ked je vsetko vyhadzane
  // panacik: ku skrini, potom odchadza doprava (pred skrinou) von z framu
  const atX = CAB.x - 70,
    atY = CAB.y + 70;
  const px = 200 + (atX - 200) * walk + (560 - atX) * leave;
  const py = 260 + (atY - 260) * walk;
  const [sx, sy] = iso(px, py, 0);
  // vyhodene veci: sanon a rolka, obluk zo skrine na podlahu, dopad v rade
  const thrown = [
    { start: 1700, tx: CAB.x + 5, ty: CAB.y + 106, kind: 'b' as const },
    { start: 2100, tx: CAB.x + 55, ty: CAB.y + 100, kind: 'r' as const },
    { start: 2500, tx: CAB.x + 100, ty: CAB.y + 112, kind: 'p' as const },
  ];

  return (
    <svg width={1920} height={1080} viewBox="-470 -80 980 551" style={{ position: 'absolute', left: 0, top: 0 }}>
      <Floor x={-40} y={-40} w={520} d={420} fill="#263246" edge="#131F31" />
      <Desk x={40} y={160} />
      <Chair x={90} y={248} />
      <Lying x={60} y={170} z={75} label={['FAKTÚRY', '2021']} />
      <Papers x={104} y={168} z={75} h={5} />
      <Papers x={112} y={186} z={80} h={3} />
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
      {thrown.map((it, i) => {
        const t = tw(it.start, 700);
        if (t <= 0) return null;
        const sxp = CAB.x + 20,
          syp = CAB.y + 60;
        const x = sxp + (it.tx - sxp) * t,
          y = syp + (it.ty - syp) * t;
        const zz = 90 * (1 - t) + 80 * Math.sin(Math.PI * t);
        const [cx, cy] = iso(x + 16, y + 15, zz);
        return (
          <g key={i} transform={`rotate(${(1 - t) * 40} ${cx} ${cy})`}>
            {it.kind === 'b' ? <Lying x={x} y={y} z={zz} /> : it.kind === 'r' ? <Roll x={x} y={y + 8} z={zz} len={90} /> : <Papers x={x} y={y} z={zz} h={8} />}
          </g>
        );
      })}
      {qm.map((s, i) => {
        const bob = Math.sin(frame / 10 + i * 2.1) * 3;
        const [qx, qy] = iso(atX - 30 + Math.sin(frame / 14 + i) * 1.5, atY - 4, 140 + bob);
        return <QuestionMark key={i} x={qx} y={qy} s={s * 0.9} />;
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
/** Rychle prehladanie: krabica von, veko, vsetky zlozky naraz hore, "?", spat, veko, zasunut (2,2 s). */
const fastSearch = (tw: (s: number, d: number) => number, start: number, hold = 0) => {
  const out = tw(start - 400, 400) * (1 - tw(start + 1800 + hold, 400));
  const lid = tw(start, 400) * (1 - tw(start + 1500 + hold, 400));
  const binders = [0, 1, 2].map((i) => tw(start + 300 + i * 60, 300) * (1 - tw(start + 1200 + hold, 300))) as [number, number, number];
  return { out, lid, binders };
};

const Warehouse: React.FC<{ frame: number }> = ({ frame }) => {
  const tw = (s: number, d: number) => tween(frame, s, d);
  const walk = tw(5200, 1300); // panacik vojde do skladu, ked je uz sklad v zabere
  const seg = Math.min(PATH.length - 2, Math.floor(walk * (PATH.length - 1)));
  const lt = walk * (PATH.length - 1) - seg;
  const px = PATH[seg][0] + (PATH[seg + 1][0] - PATH[seg][0]) * lt;
  const py = PATH[seg][1] + (PATH[seg + 1][1] - PATH[seg][1]) * lt;
  const [sx, sy] = iso(px, py, 0);
  const walked: [number, number][] = [...PATH.slice(0, seg + 1), [px, py]];
  const pathD = walked.map(([x, y], i) => `${i ? 'L' : 'M'}${iso(x, y, 0).join(' ')}`).join(' ');
  const qm: [number, number, number, number][] = [
    [140, 60, 5500, 0],
    [420, 60, 6000, 80],
  ];
  const others = 1 - tw(6300, 500);
  const A = fastSearch(tw, 6700);
  const B = fastSearch(tw, 8900, 200); // druha krabica drzi otvorena o 0,2 s dlhsie
  const qEnd = pop(frame, 11200);

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
    <Camera keys={[{ ms: 6000, x: 0, y: 0, scale: 1 }, { ms: 6900, ...CAM_END }]}>
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
                    if (isTarget && lvl === SHELF_LEVEL) {
                      const st = k === 0 ? A : B;
                      return <SearchCarton key={`${lvl}${k}`} x={cx} y={cy} z={cz} out={st.out} lid={st.lid} binders={st.binders} />;
                    }
                    return <Carton key={`${lvl}${k}`} x={cx} y={cy} z={cz} />;
                  })
                }
              </ShelfFrame>
              {isTarget
                ? [7200, 9300].map((ms, k) => {
                    // bublinka "?" pri vytiahnuti prvej zlozky z kazdej krabice
                    const q = SEARCH_QMS[k];
                    const life = tw(ms, 2000);
                    const fade = 1 - tw(ms + 1600, 400);
                    const [qx, qy] = iso(q[0] + Math.sin(life * Math.PI * 2 + k) * 6, q[1], q[2] + life * 26);
                    return <QuestionMark key={`q${k}`} x={qx} y={qy} s={pop(frame, ms) * 0.55 * fade} />;
                  })
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
            const s = pop(frame, s0) * (1 - tw(6000, 500));
            const [qx, qy] = iso(x, y, 140 + z);
            return <QuestionMark key={i} x={qx} y={qy} s={s * 1.8} />;
          })}
        </g>
        <Person x={sx} y={sy} scale={1.4} color={BRAND[400]} opacity={tw(5200, 200) * (1 - tw(6300, 600))} />
      </svg>
    </Camera>
  );
};

export const C2_Hladanie: React.FC = () => {
  const frame = useCurrentFrame();
  const showCap = useCaptions();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const pan = tw(PAN_AT, PAN_MS);

  return (
    <Scene mode="dark">
      {/* prestrih: sklad je v suterene - platna s kancelariou sa posunie hore a odhali platnu so skladom pod nou */}
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${-1080 * pan}px)` }}>
        {pan < 1 ? (
          <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, overflow: 'hidden' }}>
            <Office frame={frame} />
          </div>
        ) : null}
        {pan > 0 ? (
          <div style={{ position: 'absolute', left: 0, top: 1080, width: 1920, height: 1080, overflow: 'hidden' }}>
            <Warehouse frame={frame} />
          </div>
        ) : null}
      </div>
      {showCap ? (
        <>
          <Caption text={captions.C2} mode="dark" t={settle(frame, 1500)} out={tw(4300, 300)} y={SAFE.captionY} />
          <Caption text={captions.C2b} mode="dark" t={settle(frame, 7200)} y={SAFE.captionY} />
        </>
      ) : null}
    </Scene>
  );
};
