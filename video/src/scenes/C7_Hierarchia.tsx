import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene, useCaptions } from '../components/Scene';
import { Caption } from '../components/Text';
import { PhoneFrame } from '../components/Device';
import { ArchiveBox } from '../components/ArchiveBox';
import { Camera } from '../lib/camera';
import { Binder, Carton, IsoBox, QrOnLeftFace, ShelfFrame, iso, pts } from '../lib/iso';
import { drawProps, pop, settle, tween } from '../lib/anim';
import { Check } from '../components/Illustrations';
import { captions } from '../copy/sk';
import { BRAND, FONT, INK, ISO, SAFE } from '../theme';

/**
 * C7 - Hierarchia + sken. Zacina tou istou krabicou ako C5 (zatvorena, s QR,
 * velka v strede); kamera sa oddiali, vedla sa objavia rovnake krabice s
 * medzerou a velka krabica sa do nej zaradi; nad nou vyrastie prazdna polica
 * (2 rady), pod nou zlozky a dokumenty. Mobil naskenuje krabicu, vetva sa
 * zvyrazni; kamera sa priblizi spat na policu a krabice sa do nej poukladaju
 * (KR_01 s QR); strom vybledne, mobil najde na cely frame = strih. 12 s.
 *
 * ms: 0-500 hold · 500-2000 oddialenie + zaradenie · 900-1400 surodenci ·
 * 2100 polica, 2500 zlozky, 2900 dokumenty · 2600+i*200 QR · 3000 caption ·
 * 4200 sken · 4700 vetva · 5500-7000 priblizenie na policu · 6000+i*250
 * krabice do police · 7300 mobil hlada · 7700 najdena krabica KR_01 sa
 * zvyrazni (obrys, znacka), ostatne stmavnu · 8500 strom out · 9000-10500 najazd.
 */
const PX = 3;
const PHONE_AT = { x: 330, y: 330, w: 7 * PX * 6, h: 15 * PX * 6 };
const NODE_X = 500;
const NODES_Y = [110, 300, 540, 690];
const BOX = 150; // velkost uzla "Krabica" (ArchiveBox)
const SIB = 230;
const SVG_AT = { x: 260, y: SAFE.illoTop };
// stred police (v px stranky) pre priblizenie
const SHELF_C = { x: SVG_AT.x + NODE_X - 3, y: SVG_AT.y + NODES_Y[0] + 20 - 47 };

export const C7_Hierarchia: React.FC = () => {
  const frame = useCurrentFrame();
  const showCap = useCaptions();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const zoomOut = tw(500, 1500);
  const lvlStart = [2100, 0, 2500, 2900];
  const lvl = (i: number) => settle(frame, lvlStart[i]);
  const line = (i: number) => tw([2300, 2500, 2900][i], 400);
  const qr = (i: number) => pop(frame, 2600 + i * 200);
  const sibIn = (k: number) => settle(frame, 900 + k * 250);
  const scan = tw(4200, 500) * (1 - tw(5500, 400));
  const glow = tw(4700, 400);
  const placed = (i: number) => pop(frame, 6000 + i * 250);
  const search = tw(7300, 400);
  const found = pop(frame, 7700);
  const FOUND = 2; // KR_01
  const treeOut = 1 - tw(8500, 500);
  const fill = tw(9000, 1500);

  // velka krabica z C5 (ArchiveBox 860 px) sa zmensi a zasunie do medzery medzi rovnake krabice
  const bigSize = 860 - (860 - BOX) * zoomOut;
  const nodeLeft = SVG_AT.x + NODE_X - BOX / 2;
  const nodeTop = SVG_AT.y + NODES_Y[1] + 20;
  const bigLeft = 960 - bigSize / 2 + (nodeLeft - (960 - BOX / 2)) * zoomOut;
  const bigTop = SAFE.illoTop - 40 + (nodeTop - (SAFE.illoTop - 40)) * zoomOut;

  const sib = [[], [-SIB, SIB], [-SIB, SIB], [-SIB, SIB]];
  const Node: React.FC<{ level: number; x: number; y: number; main?: boolean; t: number; q: number; docId?: string }> = ({ level, x, y, main, t, q, docId }) => {
    const dim = main ? 1 : 0.55 + 0.45 * (1 - glow);
    return (
      <g transform={`translate(${x} ${y}) translate(0 ${(1 - t) * -20})`} opacity={t * dim}>
        <g transform="translate(0 20)">
          {level === 0 ? (
            <ShelfFrame x={-65} y={-30} w={130} d={60} levels={2} levelH={44} topBoard={false}>
              {(lv) => (
                <g>
                  {[0, 1].map((k) => {
                    const i = lv * 2 + k;
                    const p = placed(i);
                    const cx = -57 + k * 60,
                      cy = -18,
                      cz = lv * 44 + 4;
                    const isFound = i === FOUND;
                    const dim = isFound ? 1 : 1 - 0.45 * Math.min(1, found * 1.4);
                    const w = 52,
                      d = 36,
                      h = 40;
                    return (
                      <g key={k} transform={`translate(0 ${(1 - p) * -30})`} opacity={p * dim}>
                        <Carton x={cx} y={cy} z={cz} qr={p} qrSize={0.3} />
                        {isFound && found > 0 ? (
                          <g>
                            {/* obrys siluety najdenej krabice + znacka nad nou */}
                            <polygon
                              points={pts([iso(cx - 2, cy + d + 2, cz), iso(cx + w + 2, cy + d + 2, cz), iso(cx + w + 2, cy - 2, cz), iso(cx + w + 2, cy - 2, cz + h), iso(cx - 2, cy - 2, cz + h), iso(cx - 2, cy + d + 2, cz + h)])}
                              fill="none"
                              stroke={BRAND[600]}
                              strokeWidth={2.5 + Math.sin(frame / 4) * 0.6}
                              strokeLinejoin="round"
                              opacity={Math.min(1, found * 1.4)}
                            />
                            {(() => {
                              const [mx, my] = iso(cx + w / 2, cy + d / 2, cz + h + 22 + Math.sin(frame / 8) * 2);
                              return <Check x={mx} y={my} s={found * 0.55} />;
                            })()}
                          </g>
                        ) : null}
                      </g>
                    );
                  })}
                </g>
              )}
            </ShelfFrame>
          ) : level === 2 ? (
            <g>
              <Binder x={-16} y={-4} z={0} />
              <QrOnLeftFace x={-8} y={4} z={16} size={14} s={q} />
            </g>
          ) : (
            <g>
              <IsoBox x={-10} y={-15} z={0} w={21} d={30} h={1} faces={{ top: '#fff', left: ISO.right, right: ISO.edge }} />
              <QrOnLeftFace x={-4} y={15} z={-3} size={8} s={q} />
              {/* oznacenie dokumentu */}
              <text x={0} y={46} textAnchor="middle" fontFamily="ui-monospace, Menlo, monospace" fontSize={18} fill={INK[500]} opacity={q}>
                {docId}
              </text>
            </g>
          )}
        </g>
      </g>
    );
  };

  return (
    <Scene mode="light" footer footerOpacity={1 - fill}>
      <Camera keys={[{ ms: 5500, x: 0, y: 0, scale: 1 }, { ms: 7000, x: SHELF_C.x - 960, y: SHELF_C.y - 540, scale: 2.4 }]}>
        <svg width={1400} height={760} viewBox="0 0 1400 760" style={{ position: 'absolute', left: SVG_AT.x, top: SVG_AT.y, opacity: treeOut }}>
          {NODES_Y.slice(1).map((ny, i) => {
            const py = NODES_Y[i] + (i === 0 ? 100 : i === 1 ? 170 : 90);
            const t = line(i);
            return (
              <g key={i}>
                {[0, ...sib[i + 1]].map((dx, k) => {
                  const d = `M${NODE_X} ${py} C ${NODE_X} ${py + 50}, ${NODE_X + dx} ${ny - 40}, ${NODE_X + dx} ${ny + (i === 0 ? 20 : 10)}`;
                  const strong = dx === 0;
                  return <path key={k} d={d} fill="none" stroke={strong && glow > 0.5 ? BRAND[600] : INK[300]} strokeWidth={strong ? 3 : 2} strokeLinecap="round" opacity={strong ? 1 : 0.6 * (1 - 0.6 * glow)} {...drawProps(t, 400)} />;
                })}
              </g>
            );
          })}
          {NODES_Y.map((ny, i) =>
            i === 1 ? null : (
              <g key={i}>
                {sib[i].map((dx, k) => (
                  <Node key={k} level={i} x={NODE_X + dx} y={ny} t={lvl(i)} q={qr(i) * 0.9} docId={['DK_06', 'DK_08'][k]} />
                ))}
                <Node level={i} x={NODE_X} y={ny} main t={lvl(i)} q={qr(i)} docId="DK_07" />
              </g>
            ),
          )}
          {NODES_Y.map((ny, i) => (
            <g key={`t${i}`}>
              <text x={NODE_X + 380} y={ny + 62 + (i === 0 ? 0 : i === 1 ? 20 : -10)} fontFamily={FONT.body} fontSize={30} fontWeight={600} fill={INK[700]} opacity={(i === 1 ? zoomOut : lvl(i)) * zoomOut}>
                {['Polica', 'Krabica', 'Zložka', 'Dokument'][i]}
              </text>
              <text x={NODE_X + 380} y={ny + 98 + (i === 0 ? 0 : i === 1 ? 20 : -10)} fontFamily="ui-monospace, Menlo, monospace" fontSize={22} fill={INK[500]} opacity={qr(i) * zoomOut}>
                {['PO_01', 'KR_01', 'ZL_12', 'DK_07'][i]}
              </text>
            </g>
          ))}
          <rect x={NODE_X - 80} y={NODES_Y[1] + 10} width={160} height={160} rx={10} fill="none" stroke={BRAND[600]} strokeWidth={4} opacity={scan * (1 - glow * 0.5)} transform={`translate(${NODE_X} ${NODES_Y[1] + 90}) scale(${1.3 - 0.3 * scan}) translate(${-NODE_X} ${-NODES_Y[1] - 90})`} />
        </svg>

        {/* surodenci: rovnake krabice vlavo a vpravo, medzera uprostred pre hlavnu */}
        {sib[1].map((dx, k) => {
          const t = sibIn(k);
          return (
            <div key={k} style={{ position: 'absolute', left: nodeLeft + dx, top: nodeTop, opacity: t * treeOut * (0.55 + 0.45 * (1 - glow)), transform: `translateX(${(1 - t) * -dx * 0.3}px)` }}>
              <ArchiveBox state={{ lid: 0, binders: [0, 0, 0], qr: [0, 0, 0, 1] }} size={BOX} />
            </div>
          );
        })}
        {/* hlavna krabica: ta ista ako v C5, zmensuje sa a zaradi sa do medzery */}
        <div style={{ position: 'absolute', left: bigLeft, top: bigTop, opacity: treeOut }}>
          <ArchiveBox state={{ lid: 0, binders: [0, 0, 0], qr: [0, 0, 0, 1] }} size={bigSize} />
        </div>
      </Camera>

      <div style={{ position: 'absolute', inset: 0, opacity: tw(4200, 500) * (fill > 0 ? 1 : 1) }}>
        <PhoneFrame at={PHONE_AT} fill={fill} rotate={-6}>
          <div style={{ position: 'absolute', inset: 0, background: '#fff' }}>
            <div style={{ position: 'absolute', inset: '30% 18% 40% 18%', border: `3px solid ${BRAND[600]}`, borderRadius: 6, opacity: (1 - fill) * (1 - search) }} />
            {/* hladanie v mobile: riadok s lupou a vysledok KR_01 */}
            <div style={{ position: 'absolute', left: '10%', right: '10%', top: '14%', opacity: search * (1 - fill) }}>
              <div style={{ height: 22, borderRadius: 6, border: `2px solid ${INK[300]}`, display: 'flex', alignItems: 'center', padding: '0 6px', gap: 5 }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', border: `2px solid ${INK[500]}` }} />
                <div style={{ height: 4, width: `${40 * search}%`, background: INK[400], borderRadius: 2 }} />
              </div>
              <div style={{ marginTop: 10, height: 26, borderRadius: 6, background: BRAND[100], display: 'flex', alignItems: 'center', padding: '0 6px', gap: 6, opacity: found, transform: `translateY(${(1 - found) * 8}px)` }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: BRAND[600] }} />
                <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11, fontWeight: 600, color: BRAND[800] }}>KR_01</span>
              </div>
            </div>
          </div>
        </PhoneFrame>
      </div>

      {showCap ? <Caption text={captions.C7} t={settle(frame, 3000)} out={tw(6800, 300)} y={SAFE.captionY} /> : null}
    </Scene>
  );
};
