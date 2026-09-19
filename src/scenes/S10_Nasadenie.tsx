import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene } from '../components/Scene';
import { TextColumn } from '../components/Text';
import { IsoBox } from '../lib/iso';
import { Sheet } from '../components/Illustrations';
import { LogoMark } from '../components/Scene';
import { pop, settle } from '../lib/anim';
import { sk } from '../copy/sk';
import { BRAND, FONT, INK, ISO } from '../theme';

/** S10 - Nasadenie: U nas / U vas + zeleny pas s exportnym balikom. 6 s. */
const T = sk.S10;

const Server: React.FC<{ t: number; accent?: boolean }> = ({ t, accent }) => (
  <svg width={220} height={200} viewBox="-110 -140 220 200" style={{ opacity: t }}>
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <IsoBox x={-30} y={-30} z={i * 26} w={60} d={60} h={22} />
        <circle {...(() => ({ cx: 22, cy: -i * 26 + 4, r: 3.5 }))()} fill={accent && i === 1 ? BRAND[500] : ISO.ink} />
      </g>
    ))}
  </svg>
);

const Building: React.FC<{ t: number }> = ({ t }) => (
  <svg width={220} height={200} viewBox="-110 -140 220 200" style={{ opacity: t }}>
    <IsoBox x={-40} y={-30} z={0} w={80} d={50} h={90} />
    {[0, 1, 2].map((r) =>
      [0, 1, 2].map((c) => (
        <polygon key={`${r}${c}`} points={`${-32 + c * 22},${-10 - r * 26 + c * 11} ${-20 + c * 22},${-4 - r * 26 + c * 11} ${-20 + c * 22},${6 - r * 26 + c * 11} ${-32 + c * 22},${0 - r * 26 + c * 11}`} fill={ISO.ink} />
      )),
    )}
  </svg>
);

export const S10_Nasadenie: React.FC = () => {
  const frame = useCurrentFrame();
  const a = settle(frame, 900);
  const b = settle(frame, 1200);
  const band = settle(frame, 2200);
  const pack = [pop(frame, 2900), pop(frame, 3150), pop(frame, 3400)];
  const Card: React.FC<{ t: number; title: string; text: string; children: React.ReactNode }> = ({ t, title, text, children }) => (
    <div style={{ width: 800, height: 300, borderRadius: 14, background: INK[50], border: `1.5px solid ${INK[200]}`, display: 'flex', alignItems: 'center', gap: 30, padding: '0 40px', opacity: t, transform: `translateY(${(1 - t) * 26}px)` }}>
      <div style={{ width: 220 }}>{children}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 40, color: INK[900] }}>{title}</div>
        <div style={{ fontFamily: FONT.body, fontSize: 27, color: INK[700], marginTop: 12, lineHeight: 1.4 }}>{text}</div>
      </div>
    </div>
  );
  return (
    <Scene mode="light">
      <TextColumn kicker={T.kicker} lines={T.h} tKicker={settle(frame, 0)} tLines={[settle(frame, 150), settle(frame, 280)]} width={1600} headlineSize={62} top={110} />
      <div style={{ position: 'absolute', left: 120, top: 400, display: 'flex', gap: 40 }}>
        <Card t={a} title={T.a[0]} text={T.a[1]}>
          <div style={{ position: 'relative' }}>
            <Server t={1} accent />
            <div style={{ position: 'absolute', left: 150, top: 10 }}>
              <LogoMark size={40} />
            </div>
          </div>
        </Card>
        <Card t={b} title={T.b[0]} text={T.b[1]}>
          <Building t={1} />
        </Card>
      </div>
      <div style={{ position: 'absolute', left: 120, top: 740, width: 1680, height: 150, borderRadius: 14, background: `linear-gradient(90deg, ${BRAND[700]}, ${BRAND[600]})`, display: 'flex', alignItems: 'center', gap: 40, padding: '0 40px', opacity: band, transform: `translateY(${(1 - band) * 26}px)` }}>
        <div style={{ fontFamily: FONT.body, fontSize: 27, color: '#fff', flex: 1, lineHeight: 1.4 }}>
          <div style={{ fontSize: 20, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: BRAND[200], marginBottom: 6 }}>V oboch prípadoch</div>
          {T.band}
        </div>
        <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
          {[
            <div key="t" style={{ width: 90, height: 90, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 54, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} style={{ height: 6, borderRadius: 3, background: i === 0 ? INK[900] : INK[300] }} />
                ))}
              </div>
            </div>,
            <div key="p" style={{ width: 90, height: 90, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sheet w={44} h={60} lines={3} qr />
            </div>,
            <div key="q" style={{ width: 90, height: 90, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={52} height={52} viewBox="0 0 52 52">
                <rect width={52} height={52} fill={BRAND[600]} rx={4} />
                <rect x={8} y={8} width={12} height={12} fill={ISO.ink} />
                <rect x={32} y={8} width={12} height={12} fill={ISO.ink} />
                <rect x={8} y={32} width={12} height={12} fill={ISO.ink} />
                <rect x={26} y={26} width={8} height={8} fill={ISO.ink} />
                <rect x={36} y={36} width={8} height={8} fill={ISO.ink} />
              </svg>
            </div>,
          ].map((el, i) => (
            <div key={i} style={{ opacity: Math.min(1, pack[i] * 1.4), transform: `scale(${0.6 + 0.4 * pack[i]})` }}>
              {el}
            </div>
          ))}
        </div>
      </div>
    </Scene>
  );
};
