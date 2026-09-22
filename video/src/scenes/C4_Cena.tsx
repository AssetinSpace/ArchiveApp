import React from 'react';
import { useCurrentFrame } from 'remotion';
import { LogoMark, Scene, useCaptions } from '../components/Scene';
import { ArchiveBox, archiveBoxClosed } from '../components/ArchiveBox';
import { Caption } from '../components/Text';
import { Camera } from '../lib/camera';
import { Carton, ShelfFrame, iso } from '../lib/iso';
import { PriceTag, QuestionMark, Sheet } from '../components/Illustrations';
import { drawProps, pop, settle, tween } from '../lib/anim';
import { captions } from '../copy/sk';
import { BRAND, CM, FONT, INK, NAVY, SAFE } from '../theme';
import { CAM_END, SV, TARGET_SHELF, VB } from './C3_Sklad';

/**
 * C4 - Cena. Zacina rovnakym zaberom ako koniec C3. Regal sa odsunie
 * dolava; nad nim vyskoci vela otaznikov; uprostred tikaju hodiny (hladanie
 * trva); sipka doprava -> vykres "nove vyhotovenie" (rychlejsie spravit
 * nanovo); cenovky; "2x". Potom predel problem -> riesenie: vsetko okrem
 * regalu vybledne, kamera najde na krabicu, z nej sa rozleje biele svetlo
 * so zelenym lemom, na bielej sa nakresli znacka Assetin s lockupom
 * (ozvena intra), lockup zmizne do paticky a na podstavci sa usadi krabica
 * z C5. 11,5 s.
 *
 * ms: 800 odsun · 1400+i*220 "?" · 2600 hodiny · 2600-4200 rucicka ·
 * 3400 sipka · 3600 vykres · 4200 cenovka B · 4600 cenovka A · 5400 "2x" ·
 * 5800 caption · 9000-9500 vsetko vybledne, kamera na krabicu · 9700-10400
 * rozsvietenie · 10200-10800 znacka sa kresli · 10500 lockup · 11000 znacka
 * a lockup odchadzaju, krabica C5 sa usadi, 11100 paticka.
 */
const BOX = 860;
export const C4_Cena: React.FC = () => {
  const frame = useCurrentFrame();
  const showCap = useCaptions();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const bigQ = pop(frame, 1100);
  const clock = settle(frame, 2600);
  const hand = tw(2600, 1600) * 720;
  const arrow = tw(3400, 500);
  const sheet = settle(frame, 3600);
  const tagB = pop(frame, 4200);
  const tagA = pop(frame, 4600);
  const big = pop(frame, 5400, { damping: 12 });
  const s = TARGET_SHELF;
  // predel problem -> riesenie
  const out = 1 - tw(9000, 500); // cenovky, hodiny, vykres, "?" vyblednu
  const light = tw(9700, 700); // biele svetlo z krabice
  const R = light * 1500;
  const markDraw = tw(10200, 600);
  const markFill = tw(10700, 300);
  const lockup = settle(frame, 10500);
  const brandOut = tw(10850, 300);
  const box = settle(frame, 11100);
  const footer = tw(11100, 400);
  const CAM_MID = { x: CAM_END.x + 590 / CAM_END.scale, y: CAM_END.y + 70 / CAM_END.scale, scale: 1.5 };
  const boxLeft = 960 - BOX / 2;
  const boxTop = SAFE.illoTop - 40;
  return (
    <Scene mode="dark" footer footerMode="light" footerOpacity={footer}>
      <Camera keys={[{ ms: 0, ...CAM_END }, { ms: 1700, ...CAM_MID }, { ms: 9000, ...CAM_MID }, { ms: 10100, x: CAM_END.x, y: CAM_END.y, scale: 2.4 }]}>
        <svg width={1920} height={1080} viewBox={`${VB.x} ${VB.y} ${1920 / SV} ${1080 / SV}`} style={{ position: 'absolute', left: 0, top: 0 }}>
          <ShelfFrame x={s.x} y={s.y} w={CM.shelf.w} d={CM.shelf.d} levels={2} levelH={CM.shelf.level} topBoard={false}>
            {(lvl) => [0, 1].map((k) => <Carton key={`${lvl}${k}`} x={s.x + 8 + k * 60} y={s.y + 12} z={lvl * CM.shelf.level + 4} />)}
          </ShelfFrame>
          {(() => {
            const [qx, qy] = iso(s.x + 65, s.y + 30, 2 * CM.shelf.level + 14);
            return <QuestionMark x={qx} y={qy} s={0.7 * (1 - tw(800, 500))} />;
          })()}
        </svg>
      </Camera>

      {/* velky otaznik vedla regalu (rovnaka velkost ako hodiny) */}
      <svg width={240} height={240} viewBox="-120 -120 240 240" style={{ position: 'absolute', left: 715, top: 380, opacity: Math.min(1, bigQ * 1.4) * out, transform: `scale(${0.6 + 0.4 * bigQ})` }}>
        <circle r={100} fill={BRAND[300]} />
        <text x={0} y={48} textAnchor="middle" fontFamily="Manrope" fontWeight={800} fontSize={150} fill={NAVY[900]}>
          ?
        </text>
      </svg>
      {/* hodiny v strede medzery medzi regalom a vykresom */}
      <svg width={240} height={240} viewBox="-120 -120 240 240" style={{ position: 'absolute', left: 955, top: 380, opacity: clock * out, transform: `scale(${0.6 + 0.4 * clock})` }}>
        <circle r={95} fill="#1B2A44" stroke="#fff" strokeWidth={10} />
        {[0, 90, 180, 270].map((a) => (
          <line key={a} x1={0} y1={-84} x2={0} y2={-68} stroke={BRAND[400]} strokeWidth={8} strokeLinecap="round" transform={`rotate(${a})`} />
        ))}
        <line x1={0} y1={0} x2={0} y2={-62} stroke="#fff" strokeWidth={9} strokeLinecap="round" transform={`rotate(${hand})`} />
        <line x1={0} y1={0} x2={0} y2={-42} stroke="#fff" strokeWidth={9} strokeLinecap="round" transform={`rotate(${hand / 12 + 60})`} />
        <circle r={8} fill={BRAND[400]} />
      </svg>
      {/* sipka hodiny -> vykres */}
      <svg width={180} height={80} viewBox="0 0 180 80" style={{ position: 'absolute', left: 1200, top: 460, opacity: arrow > 0 ? out : 0 }}>
        <path d="M10 40 H150" fill="none" stroke={BRAND[400]} strokeWidth={8} strokeLinecap="round" {...drawProps(arrow, 140)} />
        <path d="M122 12 L156 40 L122 68" fill="none" stroke={BRAND[400]} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" opacity={arrow > 0.85 ? 1 : 0} />
      </svg>

      <div style={{ position: 'absolute', left: 300, top: 720, opacity: out }}>
        <PriceTag text="skladovanie" s={tagA} color={BRAND[700]} size={36} />
      </div>
      <div style={{ position: 'absolute', left: 1395, top: 300, opacity: sheet * out, transform: `translateY(${(1 - sheet) * 30}px) rotate(-4deg)` }}>
        <Sheet w={280} h={390} lines={7} stamp />
      </div>
      <div style={{ position: 'absolute', left: 1395, top: 720, opacity: out }}>
        <PriceTag text="nové vyhotovenie" s={tagB} color={BRAND[700]} size={36} />
      </div>
      {/* 2x €€€ dole v strede, medzi cenovkami */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', opacity: big * out, transform: `scale(${0.6 + 0.4 * big})`, whiteSpace: 'nowrap' }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 200, lineHeight: 0.9, color: BRAND[400], letterSpacing: '-0.04em' }}>2×</span>
        <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 130, lineHeight: 0.9, color: BRAND[400], letterSpacing: '-0.02em', marginLeft: 28 }}>€€€</span>
      </div>
      {showCap ? <Caption text={captions.C4} mode="dark" t={settle(frame, 5800)} out={tw(8600, 400)} y={SAFE.captionY} /> : null}

      {/* rozsvietenie: biele svetlo z krabice so zelenym lemom */}
      {light > 0 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 50% 50%, #fff ${R}px, ${BRAND[400]} ${R + 8}px, rgba(79,168,90,0) ${R + 60}px)`,
            pointerEvents: 'none',
          }}
        />
      ) : null}
      {light >= 1 ? <div style={{ position: 'absolute', inset: 0, background: '#fff' }} /> : null}

      {/* znacka Assetin + lockup (ozvena intra) na bielej */}
      {markDraw > 0 ? (
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - brandOut, transform: `scale(${1 - 0.15 * brandOut})`, transformOrigin: '50% 50%' }}>
          <div style={{ position: 'absolute', left: 960 - 80, top: 300 }}>
            <div style={{ position: 'absolute', left: 0, top: 0 }}>
              <LogoMark size={160} color={BRAND[700]} draw={markDraw} />
            </div>
            <div style={{ position: 'absolute', left: 0, top: 0, opacity: markFill }}>
              <LogoMark size={160} color={BRAND[700]} />
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 520,
              textAlign: 'center',
              opacity: lockup,
              transform: `translateY(${(1 - lockup) * 16}px)`,
              fontFamily: FONT.display,
              fontSize: 84,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              color: INK[900],
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontWeight: 800 }}>
              asset<span style={{ color: BRAND[600] }}>in</span>
            </span>
            <span style={{ display: 'inline-block', width: 4, height: 64, background: INK[300], borderRadius: 2, margin: '0 28px', verticalAlign: 'middle', opacity: 0.6 }} />
            <span style={{ fontWeight: 800 }}>Archives</span>
          </div>
        </div>
      ) : null}

      {/* krabica z C5 sa usadi na podstavec = prvy frame C5 */}
      {box > 0 ? <ArchiveBox state={archiveBoxClosed} size={BOX} style={{ position: 'absolute', left: boxLeft, top: boxTop, opacity: box, transform: `translateY(${(1 - box) * 30}px)` }} /> : null}
    </Scene>
  );
};
