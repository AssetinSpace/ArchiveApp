import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene } from '../components/Scene';
import { TextColumn } from '../components/Text';
import { ArchiveBox, archiveBoxAt } from '../components/ArchiveBox';
import { pop, settle, tween } from '../lib/anim';
import { sk } from '../copy/sk';
import { BRAND, FONT, INK, ISO } from '../theme';

/**
 * S05 - V sklade. Dlazdica z webu na celu obrazovku: veko, zlozky, QR.
 * Rozsirenie: harok nalepiek priletí zlava, mobil sprava odfoti stitok
 * (blesk + ramik), nad krabicou sa objavi ID.
 *
 * Casova os (ms): 0 text; 900 harok; 1600 dlazdica (0.96 s); 3200 mobil;
 * 4200 blesk; 4600 ID; 6500 hold do konca (9 s).
 */
const T = sk.S05;

export const S05_Teren: React.FC = () => {
  const frame = useCurrentFrame();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const box = archiveBoxAt(tw, 1600);

  const sheet = settle(frame, 900);
  const phone = settle(frame, 3200);
  const flash = tw(4200, 120) * (1 - tw(4320, 380));
  const frameBox = tw(4150, 260);
  const idT = pop(frame, 4600);

  return (
    <Scene mode="light">
      <TextColumn
        kicker={T.kicker}
        lines={T.h}
        body={T.p}
        tKicker={settle(frame, 0)}
        tLines={[settle(frame, 150), settle(frame, 260), settle(frame, 370)]}
        tBody={settle(frame, 600)}
        headlineSize={54}
        width={800}
      />

      {/* ilustracia vpravo */}
      <div style={{ position: 'absolute', left: 1000, top: 120, width: 820, height: 820 }}>
        {/* harok nalepiek */}
        <div
          style={{
            position: 'absolute',
            left: 40 + (1 - sheet) * -220,
            top: 560,
            opacity: sheet,
            transform: `rotate(-8deg)`,
          }}
        >
          <svg width={230} height={300} viewBox="0 0 230 300">
            <rect x={2} y={2} width={226} height={296} rx={6} fill="#fff" stroke={ISO.edge} strokeWidth={2.2} />
            {Array.from({ length: 5 }).map((_, r) =>
              Array.from({ length: 4 }).map((_, c) => {
                const x = 22 + c * 48,
                  y = 26 + r * 52;
                return (
                  <g key={`${r}${c}`}>
                    <rect x={x} y={y} width={36} height={36} fill={BRAND[600]} rx={2} />
                    <rect x={x + 5} y={y + 5} width={9} height={9} fill={ISO.ink} />
                    <rect x={x + 22} y={y + 5} width={9} height={9} fill={ISO.ink} />
                    <rect x={x + 5} y={y + 22} width={9} height={9} fill={ISO.ink} />
                    <rect x={x + 18} y={y + 18} width={6} height={6} fill={ISO.ink} />
                    <rect x={x + 26} y={y + 26} width={5} height={5} fill={ISO.ink} />
                  </g>
                );
              }),
            )}
          </svg>
        </div>

        <ArchiveBox state={box} size={720} style={{ position: 'absolute', left: 50, top: 0 }} />

        {/* ID nad krabicou */}
        <div
          style={{
            position: 'absolute',
            left: 300,
            top: 40,
            padding: '10px 22px',
            borderRadius: 10,
            background: INK[900],
            color: '#fff',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 34,
            fontWeight: 600,
            letterSpacing: '0.04em',
            opacity: Math.min(1, idT * 1.5),
            transform: `translateY(${(1 - idT) * 20}px) scale(${0.7 + 0.3 * idT})`,
          }}
        >
          {T.id}
        </div>

        {/* mobil */}
        <div
          style={{
            position: 'absolute',
            left: 560 + (1 - phone) * 260,
            top: 470,
            opacity: phone,
            transform: 'rotate(10deg)',
          }}
        >
          <svg width={180} height={340} viewBox="0 0 180 340">
            <rect x={4} y={4} width={172} height={332} rx={26} fill={INK[900]} />
            <rect x={16} y={30} width={148} height={280} rx={10} fill="#fff" />
            {/* hladacik s krabicou = "fotka" */}
            <g opacity={0.5 + 0.5 * frameBox}>
              <rect x={40} y={110} width={100} height={100} fill="none" stroke={BRAND[600]} strokeWidth={4} strokeDasharray="22 232" strokeLinecap="round" />
              <rect x={40} y={110} width={100} height={100} fill="none" stroke={BRAND[600]} strokeWidth={4} strokeDasharray="22 232" strokeDashoffset={-78} strokeLinecap="round" />
              <rect x={40} y={110} width={100} height={100} fill="none" stroke={BRAND[600]} strokeWidth={4} strokeDasharray="22 232" strokeDashoffset={-156} strokeLinecap="round" />
              <rect x={40} y={110} width={100} height={100} fill="none" stroke={BRAND[600]} strokeWidth={4} strokeDasharray="22 232" strokeDashoffset={-234} strokeLinecap="round" />
            </g>
            <circle cx={90} cy={270} r={18} fill="none" stroke={INK[400]} strokeWidth={4} />
            <circle cx={90} cy={270} r={11} fill={BRAND[600]} opacity={0.4 + 0.6 * flash} />
            <rect x={70} y={14} width={40} height={6} rx={3} fill={INK[600]} />
          </svg>
        </div>

        {/* blesk */}
        <div
          style={{
            position: 'absolute',
            inset: -200,
            background: 'radial-gradient(circle at 55% 40%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 55%)',
            opacity: flash,
            pointerEvents: 'none',
          }}
        />
        {/* ramik "odfotene" okolo stitku na krabici */}
        <svg
          width={820}
          height={820}
          viewBox="0 0 820 820"
          style={{ position: 'absolute', left: 0, top: 0, opacity: frameBox, pointerEvents: 'none' }}
        >
          <rect
            x={430}
            y={380}
            width={110}
            height={120}
            fill="none"
            stroke={BRAND[600]}
            strokeWidth={5}
            rx={6}
            transform={`translate(485 440) scale(${1.3 - 0.3 * frameBox}) translate(-485 -440)`}
          />
        </svg>
      </div>

      {/* pas "fotka je dokaz" - jemny podpis pod ilustraciou */}
      <div
        style={{
          position: 'absolute',
          left: 120,
          top: 640,
          width: 700,
          fontFamily: FONT.body,
          fontSize: 26,
          lineHeight: 1.4,
          color: INK[500],
          borderLeft: `4px solid ${BRAND[600]}`,
          paddingLeft: 22,
          opacity: tw(5200, 400),
        }}
      >
        Vytlačené nálepky, mobil, otvorená krabica. Nič iné v teréne netreba.
      </div>
    </Scene>
  );
};
