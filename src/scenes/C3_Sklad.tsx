import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene, useCaptions } from '../components/Scene';
import { Caption } from '../components/Text';
import { Camera } from '../lib/camera';
import { Binder, Carton, IsoBox, OpenCarton, Pallet, ShelfFrame, iso } from '../lib/iso';
import { Floor, Person, QuestionMark } from '../components/Illustrations';
import { pop, settle, tween } from '../lib/anim';
import { captions } from '../copy/sk';
import { BRAND, CM, SAFE } from '../theme';

/**
 * C3 - Sklad -> regal. Siroky zaber (regaly, palety, postavicka kluckuje
 * ulickou, cesta pod objektmi, "?"), kamera najde na policu s dvoma krabicami:
 * prva sa otvori, zlozky sa postupne vyberu a vratia, zatvori sa; to iste
 * druha; nic sa nenaslo, "?" nad regalom. Koniec = zaciatok C4. 14 s.
 */
export const SV = 1.7;
export const VB = { x: -565, y: -100 };
const toScreen = (p: [number, number]): [number, number] => [(p[0] - VB.x) * SV, (p[1] - VB.y) * SV];
// cesta v ulicke medzi paletami (y 130-220) a regalmi (y 40-100)
const PATH: [number, number][] = [
  [-20, 400],
  [40, 300],
  [40, 140],
  [200, 140],
  [200, 120],
  [305, 120],
  [305, 138],
];
export const PALLETS = [
  { x: 110, y: 230 },
  { x: 250, y: 230 },
  { x: 110, y: 330 },
];
export const SHELVES = [
  { x: 100, y: 40 },
  { x: 240, y: 40 },
  { x: 380, y: 40 },
];
/** Cielova polica: regal 2, 2. uroven (2 krabice). */
export const TARGET_SHELF = SHELVES[1];
export const SHELF_LEVEL = 1;
export const ZOOM = 1.8;
const T = toScreen(iso(TARGET_SHELF.x + 68, TARGET_SHELF.y + 30, SHELF_LEVEL * CM.shelf.level - 26));
export const CAM_END = { x: T[0] - 960, y: T[1] - 540, scale: ZOOM };

/** Otvorenie krabice: veko hore, 3 zlozky sa postupne vyberu (zdvihnu, podrzia, vratia), veko dole. */
export const searchBox = (tw: (s: number, d: number) => number, start: number) => {
  const lid = tw(start, 400) * (1 - tw(start + 2600, 400));
  const binders = [0, 1, 2].map((i) => {
    const s = start + 500 + i * 650;
    return tw(s, 250) * (1 - tw(s + 400, 250));
  }) as [number, number, number];
  return { lid, binders };
};

export const SearchCarton: React.FC<{ x: number; y: number; z: number; lid: number; binders: [number, number, number] }> = ({ x, y, z, lid, binders }) => {
  const w = CM.carton.w,
    d = CM.carton.d,
    h = CM.carton.h;
  const isOpen = lid > 0.05;
  return (
    <g>
      {isOpen ? (
        <OpenCarton x={x} y={y} z={z} w={w} d={d} h={h}>
          {/* zlozky stojace vnutri: pri vybrati sa zdvihnu nad okraj */}
          {binders.map((b, i) => (
            <Binder key={i} x={x + 8 + i * 14} y={y + 8} z={z + 2} w={8} d={d - 16} h={CM.binder.h - 4} lift={b * 30} />
          ))}
        </OpenCarton>
      ) : (
        <Carton x={x} y={y} z={z} w={w} d={d} h={h} />
      )}
      {/* veko: zdvihne sa a odklopi dozadu */}
      <g transform={`translate(${lid * 44} ${-lid * 46})`}>
        <IsoBox x={x - 2} y={y - 2} z={z + h} w={w + 4} d={d + 4} h={4} stroke />
      </g>
    </g>
  );
};

/** Male otazniky nad krabicou pri kazdom vytiahnuti zlozky (box A 7200, box B 10400): [x, y, z, ms]. */
export const SEARCH_QMS: [number, number, number, number][] = (() => {
  const s = TARGET_SHELF;
  const top = SHELF_LEVEL * CM.shelf.level + 4 + CM.carton.h + 4;
  const out: [number, number, number, number][] = [];
  [7200, 10400].forEach((start, k) => {
    const cx = s.x + 8 + k * 60 + 26,
      cy = s.y + 12 + 18;
    [0, 1, 2].forEach((i) => out.push([cx - 14 + i * 14, cy + (i === 1 ? -8 : 6), top + 22 + i * 14, start + 500 + i * 650]));
  });
  return out;
})();

export const C3_Sklad: React.FC = () => {
  const frame = useCurrentFrame();
  const showCap = useCaptions();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const appear = settle(frame, 400);
  const walk = tw(1500, 4500);
  const seg = Math.min(PATH.length - 2, Math.floor(walk * (PATH.length - 1)));
  const lt = walk * (PATH.length - 1) - seg;
  const px = PATH[seg][0] + (PATH[seg + 1][0] - PATH[seg][0]) * lt;
  const py = PATH[seg][1] + (PATH[seg + 1][1] - PATH[seg][1]) * lt;
  const [sx, sy] = iso(px, py, 0);
  const walked: [number, number][] = [...PATH.slice(0, seg + 1), [px, py]];
  const pathD = walked.map(([x, y], i) => `${i ? 'L' : 'M'}${iso(x, y, 0).join(' ')}`).join(' ');
  const qm: [number, number, number, number][] = [
    [140, 60, 2400, 0],
    [160, 250, 3200, 0],
    [420, 60, 4000, 80],
    [300, 250, 4800, 0],
  ];
  const others = 1 - tw(6800, 500); // vsetko okrem cieloveho regalu zmizne
  const A = searchBox(tw, 7200);
  const B = searchBox(tw, 10400);
  const qEnd = pop(frame, 13300);

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
      <Camera keys={[{ ms: 6000, x: 0, y: 0, scale: 1 }, { ms: 8000, ...CAM_END }]}>
        <svg width={1920} height={1080} viewBox={`${VB.x} ${VB.y} ${1920 / SV} ${1080 / SV}`} style={{ position: 'absolute', left: 0, top: 0, opacity: appear, transform: `translateY(${(1 - appear) * 30}px)` }}>
          <g opacity={others}>
            <Floor x={-60} y={-60} w={560} d={560} fill="#263246" edge="#131F31" />
            <path d={pathD} fill="none" stroke={BRAND[300]} strokeWidth={2.4} strokeDasharray="6 8" strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
          </g>
          {SHELVES.map((s, i) => {
            const t = settle(frame, 600 + i * 140);
            const isTarget = s === TARGET_SHELF;
            return (
              <g key={i} transform={`translate(0 ${(1 - t) * -30})`} opacity={t * (isTarget ? 1 : others)}>
                <ShelfFrame x={s.x} y={s.y} w={CM.shelf.w} d={CM.shelf.d} levels={2} levelH={CM.shelf.level} topBoard={false}>
                  {(lvl) =>
                    [0, 1].map((k) => {
                      const cx = s.x + 8 + k * 60,
                        cy = s.y + 12,
                        cz = lvl * CM.shelf.level + 4;
                      if (isTarget && lvl === SHELF_LEVEL) {
                        const st = k === 0 ? A : B;
                        return <SearchCarton key={`${lvl}${k}`} x={cx} y={cy} z={cz} lid={st.lid} binders={st.binders} />;
                      }
                      return <Carton key={`${lvl}${k}`} x={cx} y={cy} z={cz} />;
                    })
                  }
                </ShelfFrame>
                {isTarget
                  ? SEARCH_QMS.map(([x, y, z, ms], i) => {
                      const [qx, qy] = iso(x, y, z);
                      return <QuestionMark key={`q${i}`} x={qx} y={qy} s={pop(frame, ms) * 0.3} />;
                    })
                  : null}
                {isTarget ? (() => {
                  const [qx, qy] = iso(s.x + 65, s.y + 30, 2 * CM.shelf.level + 14);
                  return <QuestionMark x={qx} y={qy} s={qEnd * 0.4} />;
                })() : null}
              </g>
            );
          })}
          <g opacity={others}>
            {PALLETS.map((p, i) => {
              const t = settle(frame, 1000 + i * 140);
              return (
                <g key={i} transform={`translate(0 ${(1 - t) * -30})`} opacity={t}>
                  <Stack x={p.x} y={p.y} />
                </g>
              );
            })}
            {qm.map(([x, y, s0, z], i) => {
              const s = pop(frame, s0) * (1 - tw(6000, 600));
              const [qx, qy] = iso(x, y, 140 + z);
              return <QuestionMark key={i} x={qx} y={qy} s={s * 1.3} />;
            })}
          </g>
          <Person x={sx} y={sy} scale={1.4} color="#ffffff" opacity={tw(1400, 300) * (1 - tw(6500, 800))} />
        </svg>
      </Camera>

      {showCap ? (
        <>
          <Caption text={captions.C3a} mode="dark" t={settle(frame, 4000)} out={tw(6300, 300)} y={SAFE.captionY} />
          <Caption text={captions.C3b} mode="dark" t={settle(frame, 11500)} y={SAFE.captionY} />
        </>
      ) : null}
    </Scene>
  );
};
