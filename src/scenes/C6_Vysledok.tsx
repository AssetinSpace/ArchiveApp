import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene, useCaptions } from '../components/Scene';
import { Caption } from '../components/Text';
import { Camera } from '../lib/camera';
import { WindowFrame } from '../components/Device';
import { Binder, Carton, IsoBox, Pallet, QrOnLeftFace } from '../lib/iso';
import { drawProps, linear, pop, settle, tween } from '../lib/anim';
import { captions, sk } from '../copy/sk';
import { BRAND, FONT, INK, ISO, ms } from '../theme';

/**
 * C6 - Vysledok: hierarchia sa vybuduje, QR doskocia, sken rozsvieti vetvu;
 * kamera sa posunie doprava, prichadza okno aplikacie s tabulkou:
 * dotaz, filter, breadcrumb; zaver: najazd do okna = strih na footage. 14 s.
 *
 * ms: 600+i*400 urovne · 2600+i*200 QR · 3800 sken · 4300 glow ·
 * 2500 caption a · 6000 out · 6500-8000 pan · 7400 okno · 8000-9600 dotaz ·
 * 9800 filter · 10600 breadcrumb · 9800 caption b · 12300 out · 12300-13400 najazd.
 */
const T = sk.S09;
const ROWS = 8;
const HIT = 4;
const WIN = { x: 480, y: 130, w: 960, h: 700 };

export const C6_Vysledok: React.FC = () => {
  const frame = useCurrentFrame();
  const showCap = useCaptions();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const lvl = (i: number) => settle(frame, 600 + i * 400);
  const line = (i: number) => tw(900 + i * 400, 400);
  const qr = (i: number) => pop(frame, 2600 + i * 200);
  const scan = tw(3800, 500);
  const glow = tw(4300, 400);
  const pan = tw(6500, 1500);
  const winIn = settle(frame, 7400);
  const typed = Math.floor(linear(frame, 8000, 1600) * T.query.length);
  const caret = frame % 16 < 8 && frame < ms(9800);
  const filter = tw(9800, 600);
  const crumb = pop(frame, 10600);
  const fill = tw(12300, 1100);

  const nodes = [
    { x: 450, y: 60 },
    { x: 450, y: 250 },
    { x: 450, y: 440 },
    { x: 450, y: 630 },
  ];
  const sib = [[], [-190, 190], [-190, 190], [-190, 190]];
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
      <Camera keys={[{ ms: 6500, x: 0 }, { ms: 8000, x: 1500 }]}>
        <svg width={1100} height={900} viewBox="0 0 1100 900" style={{ position: 'absolute', left: 420, top: 60 }}>
          {nodes.slice(1).map((n, i) => {
            const p = nodes[i];
            const t = line(i);
            return (
              <g key={i}>
                {[0, ...sib[i + 1]].map((dx, k) => {
                  const d = `M${p.x} ${p.y + 110} C ${p.x} ${p.y + 160}, ${n.x + dx} ${n.y - 40}, ${n.x + dx} ${n.y + 10}`;
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
              <text x={n.x + 320} y={n.y + 70} fontFamily={FONT.body} fontSize={28} fontWeight={600} fill={INK[700]} opacity={lvl(i)}>
                {sk.S08.levels[i]}
              </text>
              <text x={n.x + 320} y={n.y + 104} fontFamily="ui-monospace, Menlo, monospace" fontSize={22} fill={INK[500]} opacity={qr(i)}>
                {['PL_01', 'KR_03', 'ZL_12', 'DK_07'][i]}
              </text>
            </g>
          ))}
          <g transform={`translate(${nodes[1].x - 150} ${nodes[1].y + 30})`} opacity={scan}>
            <rect x={0} y={0} width={54} height={100} rx={10} fill={INK[900]} />
            <rect x={5} y={10} width={44} height={80} rx={4} fill="#fff" />
            <rect x={14} y={30} width={26} height={26} fill="none" stroke={BRAND[600]} strokeWidth={3} />
          </g>
          <rect x={nodes[1].x - 60} y={nodes[1].y - 20} width={120} height={130} rx={10} fill="none" stroke={BRAND[600]} strokeWidth={4} opacity={scan * (1 - glow * 0.5)} transform={`translate(${nodes[1].x} ${nodes[1].y + 45}) scale(${1.3 - 0.3 * scan}) translate(${-nodes[1].x} ${-nodes[1].y - 45})`} />
        </svg>
      </Camera>

      {/* okno s tabulkou prichadza sprava pocas panu */}
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${(1 - pan) * 1500}px)`, opacity: winIn }}>
        <WindowFrame at={WIN} fill={fill}>
          <div style={{ fontFamily: FONT.body, transform: `scale(${1 + 0.45 * fill})`, transformOrigin: '0 0', width: WIN.w }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 24px', borderBottom: `1px solid ${INK[200]}`, background: INK[50] }}>
              <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={INK[500]} strokeWidth={2.4} strokeLinecap="round">
                <circle cx={10.5} cy={10.5} r={6.5} />
                <path d="M15.5 15.5 L21 21" />
              </svg>
              <div style={{ flex: 1, height: 48, borderRadius: 8, border: `2px solid ${typed > 0 ? BRAND[400] : INK[200]}`, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 24, color: INK[900] }}>
                {T.query.slice(0, typed)}
                <span style={{ width: 2, height: 28, background: INK[900], marginLeft: 2, opacity: caret ? 1 : 0 }} />
                {typed === 0 ? <span style={{ color: INK[400] }}>Hľadať…</span> : null}
              </div>
            </div>
            <div style={{ display: 'flex', padding: '10px 24px', fontSize: 16, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: INK[500], borderBottom: `1px solid ${INK[200]}` }}>
              {T.cols.map((c, i) => (
                <div key={i} style={{ flex: i === 1 ? 2.2 : 1 }}>
                  {c}
                </div>
              ))}
            </div>
            {Array.from({ length: ROWS }).map((_, r) => {
              const hit = r === HIT;
              const h = hit ? 58 : 58 * (1 - filter);
              return (
                <div key={r} style={{ display: 'flex', alignItems: 'center', padding: '0 24px', height: h, opacity: hit ? 1 : 1 - filter, background: hit && filter > 0.5 ? BRAND[50] : '#fff', borderBottom: `1px solid ${INK[100]}`, overflow: 'hidden' }}>
                  {T.cols.map((_, c) => (
                    <div key={c} style={{ flex: c === 1 ? 2.2 : 1, paddingRight: 16 }}>
                      {hit && c === 0 ? (
                        <span style={{ fontSize: 22, fontWeight: 600, color: INK[900] }}>zlozka_{r + 1}</span>
                      ) : hit && c === 1 && filter > 0.5 ? (
                        <span style={{ fontSize: 22, color: INK[900] }}>Kolaudačné rozhodnutie · Slnečná 12</span>
                      ) : (
                        <div style={{ height: 12, borderRadius: 4, background: hit ? INK[400] : INK[200], width: `${45 + ((r * 11 + c * 17) % 50)}%` }} />
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 24px', background: INK[50], borderTop: `1px solid ${INK[200]}`, opacity: crumb, transform: `translateY(${(1 - crumb) * 14}px)` }}>
              <span style={{ fontSize: 20, color: INK[500], marginRight: 8 }}>Fyzická lokácia</span>
              {T.crumb.map((c, i) => (
                <React.Fragment key={i}>
                  {i ? <span style={{ color: INK[400], fontSize: 22 }}>/</span> : null}
                  <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 24, fontWeight: 600, color: i === T.crumb.length - 1 ? BRAND[700] : INK[800], background: i === T.crumb.length - 1 ? BRAND[100] : '#fff', border: `1px solid ${INK[200]}`, borderRadius: 6, padding: '4px 10px' }}>
                    {c}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </WindowFrame>
      </div>

      {showCap ? (
        <>
          <Caption text={captions.C6a} t={settle(frame, 2500)} out={tw(6000, 300)} />
          <Caption text={captions.C6b} t={settle(frame, 11200)} out={tw(12300, 300)} y={900} />
        </>
      ) : null}
    </Scene>
  );
};
