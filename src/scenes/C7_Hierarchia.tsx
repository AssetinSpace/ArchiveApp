import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene, useCaptions } from '../components/Scene';
import { Caption } from '../components/Text';
import { PhoneFrame } from '../components/Device';
import { ArchiveBox } from '../components/ArchiveBox';
import { Binder, Carton, IsoBox, QrOnLeftFace, ShelfFrame } from '../lib/iso';
import { drawProps, pop, settle, tween } from '../lib/anim';
import { captions, sk } from '../copy/sk';
import { BRAND, CM, FONT, INK, ISO, SAFE } from '../theme';

/**
 * C7 - Hierarchia + sken. Zacina tou istou krabicou ako C5 (zatvorena, s QR,
 * velka v strede); kamera sa oddiali a okolo nej vyrastie hierarchia:
 * polica s krabicami nad nou, zlozka a dokument pod nou. Mobil v popredi
 * naskenuje krabicu, vetva sa rozsvieti; strom vybledne, mobil najde na cely
 * frame = strih na footage. 10 s.
 *
 * ms: 0-500 hold krabica · 500-2000 oddialenie · 1200+i*400 urovne ·
 * 2600+i*200 QR · 3000 caption · 4200 sken · 4700 glow · 6800 caption out ·
 * 7000 strom out · 7300-8500 najazd.
 */
const PX = 3;
const PHONE_AT = { x: 330, y: 330, w: 7 * PX * 6, h: 15 * PX * 6 };
const NODE_X = 500;
const NODES_Y = [80, 270, 450, 620];

export const C7_Hierarchia: React.FC = () => {
  const frame = useCurrentFrame();
  const showCap = useCaptions();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const zoomOut = tw(500, 1500);
  const lvl = (i: number) => settle(frame, 1200 + i * 400);
  const line = (i: number) => tw(1500 + i * 400, 400);
  const qr = (i: number) => pop(frame, 2600 + i * 200);
  const scan = tw(4200, 500);
  const glow = tw(4700, 400);
  const treeOut = 1 - tw(7000, 500);
  const fill = tw(7300, 1200);

  // velka krabica z C5 (ArchiveBox 860 px) sa zmensi na uzol "Krabica" (~150 px)
  const bigSize = 860 - (860 - 150) * zoomOut;
  const bigLeft = 960 - bigSize / 2 + (260 + NODE_X - 960) * zoomOut;
  const bigTop = SAFE.illoTop - 40 + (SAFE.illoTop + NODES_Y[1] - 40 - (SAFE.illoTop - 40)) * zoomOut;

  const sib = [[], [-230, 230], [-230, 230], [-230, 230]];
  const Node: React.FC<{ level: number; x: number; y: number; main?: boolean; t: number; q: number }> = ({ level, x, y, main, t, q }) => {
    const dim = main ? 1 : 0.55 + 0.45 * (1 - glow);
    return (
      <g transform={`translate(${x} ${y}) translate(0 ${(1 - t) * -20})`} opacity={t * dim}>
        {main && glow > 0 ? <circle cx={0} cy={40} r={90 * glow} fill={BRAND[100]} opacity={0.9} /> : null}
        <g transform="translate(0 20)">
          {level === 0 ? (
            <g>
              <ShelfFrame x={-65} y={-30} w={130} d={60} levels={1} levelH={44} />
              <Carton x={-57} y={-18} z={5} />
              <Carton x={3} y={-18} z={5} />
              <QrOnLeftFace x={-40} y={30} z={30} size={18} s={q} />
            </g>
          ) : level === 1 ? (
            <g>
              <Carton x={-26} y={-18} z={0} />
              <QrOnLeftFace x={-10} y={18} z={10} size={18} s={q} />
            </g>
          ) : level === 2 ? (
            <g>
              <Binder x={-16} y={-4} z={0} />
              <QrOnLeftFace x={-8} y={4} z={16} size={14} s={q} />
            </g>
          ) : (
            <g>
              <IsoBox x={-10} y={-15} z={0} w={21} d={30} h={1} faces={{ top: '#fff', left: ISO.right, right: ISO.edge }} />
              <QrOnLeftFace x={-4} y={15} z={-3} size={8} s={q} />
            </g>
          )}
        </g>
      </g>
    );
  };

  return (
    <Scene mode="light">
      <svg width={1400} height={760} viewBox="0 0 1400 760" style={{ position: 'absolute', left: 260, top: SAFE.illoTop, opacity: treeOut }}>
        {NODES_Y.slice(1).map((ny, i) => {
          const py = NODES_Y[i];
          const t = line(i);
          return (
            <g key={i}>
              {[0, ...sib[i + 1]].map((dx, k) => {
                const d = `M${NODE_X} ${py + 100} C ${NODE_X} ${py + 150}, ${NODE_X + dx} ${ny - 40}, ${NODE_X + dx} ${ny + 10}`;
                const strong = dx === 0;
                return <path key={k} d={d} fill="none" stroke={strong && glow > 0.5 ? BRAND[600] : INK[300]} strokeWidth={strong ? 3 : 2} strokeLinecap="round" opacity={strong ? 1 : 0.6 * (1 - 0.6 * glow)} {...drawProps(t, 400)} />;
              })}
            </g>
          );
        })}
        {NODES_Y.map((ny, i) => (
          <g key={i}>
            {sib[i].map((dx, k) => (
              <Node key={k} level={i} x={NODE_X + dx} y={ny} t={lvl(i)} q={qr(i) * 0.9} />
            ))}
            {i === 1 ? null : <Node level={i} x={NODE_X} y={ny} main t={lvl(i)} q={qr(i)} />}
            <text x={NODE_X + 380} y={ny + 62} fontFamily={FONT.body} fontSize={30} fontWeight={600} fill={INK[700]} opacity={lvl(i) * zoomOut}>
              {['Polica', 'Krabica', 'Zložka', 'Dokument'][i]}
            </text>
            <text x={NODE_X + 380} y={ny + 98} fontFamily="ui-monospace, Menlo, monospace" fontSize={22} fill={INK[500]} opacity={qr(i) * zoomOut}>
              {['PO_01', 'KR_01', 'ZL_12', 'DK_07'][i]}
            </text>
          </g>
        ))}
        {glow > 0 ? <circle cx={NODE_X} cy={NODES_Y[1] + 60} r={90 * glow} fill={BRAND[100]} opacity={0.9} /> : null}
        <rect x={NODE_X - 70} y={NODES_Y[1] - 20} width={140} height={130} rx={10} fill="none" stroke={BRAND[600]} strokeWidth={4} opacity={scan * (1 - glow * 0.5)} transform={`translate(${NODE_X} ${NODES_Y[1] + 45}) scale(${1.3 - 0.3 * scan}) translate(${-NODE_X} ${-NODES_Y[1] - 45})`} />
      </svg>

      {/* hlavna krabica: ta ista ako v C5, zmensuje sa do uzla */}
      <div style={{ position: 'absolute', left: bigLeft, top: bigTop, opacity: treeOut }}>
        <ArchiveBox state={{ lid: 0, binders: [0, 0, 0], qr: [0, 0, 0, 1] }} size={bigSize} />
      </div>

      <div style={{ position: 'absolute', inset: 0, opacity: scan }}>
        <PhoneFrame at={PHONE_AT} fill={fill} rotate={-6}>
          <div style={{ position: 'absolute', inset: 0, background: '#fff' }}>
            <div style={{ position: 'absolute', inset: '30% 18% 40% 18%', border: `3px solid ${BRAND[600]}`, borderRadius: 6, opacity: 1 - fill }} />
          </div>
        </PhoneFrame>
      </div>

      {showCap ? <Caption text={captions.C7} t={settle(frame, 3000)} out={tw(6800, 300)} y={SAFE.captionY} /> : null}
    </Scene>
  );
};
