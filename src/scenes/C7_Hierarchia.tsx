import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene, useCaptions } from '../components/Scene';
import { Caption } from '../components/Text';
import { PhoneFrame } from '../components/Device';
import { Binder, Carton, IsoBox, Pallet, QrOnLeftFace } from '../lib/iso';
import { drawProps, pop, settle, tween } from '../lib/anim';
import { captions, sk } from '../copy/sk';
import { BRAND, CM, FONT, INK, ISO, SAFE } from '../theme';

/**
 * C7 - Hierarchia + sken. Strom paleta -> krabica -> zlozka -> dokument
 * v jednej mierke (3 px/cm), QR cierno-biele; mobil (v popredi) naskenuje
 * krabicu, vetva sa rozsvieti. Bez tabulky. Zaver: strom vybledne, mobil
 * najde na cely frame = strih na footage. 9 s.
 *
 * ms: 600+i*400 urovne · 2400+i*200 QR · 3000 caption · 3800 sken ·
 * 4300 glow · 6000 caption out · 6200 strom out · 6500-7700 najazd · hold.
 */
const PX = 3;
const PHONE_AT = { x: 330, y: 330, w: 7 * PX * 6, h: 15 * PX * 6 }; // mobil v popredi (6x blizsie ku kamere)

export const C7_Hierarchia: React.FC = () => {
  const frame = useCurrentFrame();
  const showCap = useCaptions();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const lvl = (i: number) => settle(frame, 600 + i * 400);
  const line = (i: number) => tw(900 + i * 400, 400);
  const qr = (i: number) => pop(frame, 2400 + i * 200);
  const scan = tw(3800, 500);
  const glow = tw(4300, 400);
  const treeOut = 1 - tw(6200, 500);
  const fill = tw(6500, 1200);

  const nodes = [
    { x: 500, y: 40 },
    { x: 500, y: 230 },
    { x: 500, y: 420 },
    { x: 500, y: 600 },
  ];
  const sib = [[], [-230, 230], [-230, 230], [-230, 230]];
  const Node: React.FC<{ level: number; x: number; y: number; main?: boolean; t: number; q: number }> = ({ level, x, y, main, t, q }) => {
    const dim = main ? 1 : 0.55 + 0.45 * (1 - glow);
    return (
      <g transform={`translate(${x} ${y}) translate(0 ${(1 - t) * -20})`} opacity={t * dim}>
        {main && glow > 0 ? <circle cx={0} cy={40} r={90 * glow} fill={BRAND[100]} opacity={0.9} /> : null}
        <g transform={`translate(0 20) scale(${PX / 3})`}>
          {level === 0 ? (
            <g>
              <Pallet x={-60} y={-40} />
              <Carton x={-54} y={-36} z={14} />
              <Carton x={2} y={-36} z={14} />
              <Carton x={-54} y={2} z={14} />
              <Carton x={2} y={2} z={14} />
              <QrOnLeftFace x={-30} y={40} z={-2} size={20} s={q} />
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
        {nodes.slice(1).map((n, i) => {
          const p = nodes[i];
          const t = line(i);
          return (
            <g key={i}>
              {[0, ...sib[i + 1]].map((dx, k) => {
                const d = `M${p.x} ${p.y + 100} C ${p.x} ${p.y + 150}, ${n.x + dx} ${n.y - 40}, ${n.x + dx} ${n.y + 10}`;
                const strong = dx === 0;
                return <path key={k} d={d} fill="none" stroke={strong && glow > 0.5 ? BRAND[600] : INK[300]} strokeWidth={strong ? 3 : 2} strokeLinecap="round" opacity={strong ? 1 : 0.6 * (1 - 0.6 * glow)} {...drawProps(t, 400)} />;
              })}
            </g>
          );
        })}
        {nodes.map((n, i) => (
          <g key={i}>
            {sib[i].map((dx, k) => (
              <Node key={k} level={i} x={n.x + dx} y={n.y} t={lvl(i)} q={qr(i) * 0.9} />
            ))}
            <Node level={i} x={n.x} y={n.y} main t={lvl(i)} q={qr(i)} />
            <text x={n.x + 380} y={n.y + 62} fontFamily={FONT.body} fontSize={30} fontWeight={600} fill={INK[700]} opacity={lvl(i)}>
              {sk.S08.levels[i]}
            </text>
            <text x={n.x + 380} y={n.y + 98} fontFamily="ui-monospace, Menlo, monospace" fontSize={22} fill={INK[500]} opacity={qr(i)}>
              {['PL_01', 'KR_03', 'ZL_12', 'DK_07'][i]}
            </text>
          </g>
        ))}
        {/* zeleny ramik skenu okolo krabice */}
        <rect x={nodes[1].x - 70} y={nodes[1].y - 20} width={140} height={130} rx={10} fill="none" stroke={BRAND[600]} strokeWidth={4} opacity={scan * (1 - glow * 0.5)} transform={`translate(${nodes[1].x} ${nodes[1].y + 45}) scale(${1.3 - 0.3 * scan}) translate(${-nodes[1].x} ${-nodes[1].y - 45})`} />
      </svg>

      {/* mobil v popredi, ciel najazdu */}
      <div style={{ position: 'absolute', inset: 0, opacity: scan }}>
        <PhoneFrame at={PHONE_AT} fill={fill} rotate={-6}>
          <div style={{ position: 'absolute', inset: 0, background: '#fff' }}>
            <div style={{ position: 'absolute', inset: '30% 18% 40% 18%', border: `3px solid ${BRAND[600]}`, borderRadius: 6, opacity: 1 - fill }} />
          </div>
        </PhoneFrame>
      </div>

      {showCap ? <Caption text={captions.C7} t={settle(frame, 3000)} out={tw(6000, 300)} y={SAFE.captionY} /> : null}
    </Scene>
  );
};
