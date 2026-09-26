import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene, useCaptions } from '../components/Scene';
import { BrandMod, BrandSep, BrandStack, LOCKUP, LOCKUP_W } from '../components/Brand';
import { ArchiveBox, archiveBoxClosed } from '../components/ArchiveBox';
import { C5_BOX_LEFT } from './C5_Teren';
import { Caption } from '../components/Text';
import { Camera } from '../lib/camera';
import { Carton, ShelfFrame, iso } from '../lib/iso';
import { PriceTag, QuestionMark, Sheet } from '../components/Illustrations';
import { drawProps, pop, settle, tween } from '../lib/anim';
import { captions } from '../copy/sk';
import { useOutputFrame } from '../components/Paced';
import { BRAND, CM, FONT, INK, NAVY, SAFE } from '../theme';
import { CAM_END, SV, TARGET_SHELF, VB } from './C3_Sklad';

/**
 * C4 - Cena. Zacina rovnakym zaberom ako koniec C3. Regal sa odsunie
 * dolava; nad nim vyskoci vela otaznikov; uprostred tikaju hodiny (hladanie
 * trva); sipka doprava -> vykres "nove vyhotovenie" (rychlejsie spravit
 * nanovo); cenovky; "2x". Potom predel problem -> riesenie: vsetko okrem
 * regalu vybledne, kamera najde na krabicu, cista prelinacka do bielej, na
 * bielej znacka Assetin a lockup z design kitu (assetin/.space | Archives),
 * lockup zmizne do paticky a na podstavci sa usadi krabica
 * z C5. 9 s.
 *
 * ms: 800 odsun · 1100 "?" · 2600 hodiny · 2600-3600 rucicka · 3000 sipka ·
 * 3200 vykres · 3600 cenovka B · 3900 cenovka A · 4400 "2x" · 4800 caption ·
 * 5600-6100 vsetko vybledne, kamera na krabicu · 6300-7000 rozsvietenie ·
 * 6900 znacka, 7050 lockup (drzi 1 s) · 7900 znacka a lockup odchadzaju ·
 * 8100 krabica C5 sa usadi vlavo · 8200 paticka. 9 s.
 * Kolo 31: uvod (najazd kamery) sa preskakuje o 0,8 s (skip v scenesList), znacka bez domceka drzi H = 5,2 s + 0,8 s na vetu nahovoru; scena 16,9 s.
 * Kolo 33: rucicka hodin sa toci podla skutocneho casu (useOutputFrame), pauzy v scenesList su plynule; scena 15,6 s.
 * Kolo 34: bez skipu (kamera nadvazuje na koniec C2), bez otaznika nad policou, "2x" a "EUR" rovnako velke,
 * po "2x" hned prelinacka do bielej a znacka (kamera sa uz nevracia na policu).
 * Kolo 36: prvy otaznik je rovnaky ako v C2 (QuestionMark), kolo 37: znova velky vedla regalu (velkost ako hodiny), nie maly nad regalom,
 * "2x EUR" jednym textom na stred, veta "Klucom k vyrieseniu..." bez hlasu: pod lockupom text
 * "Digitalna katalogizacia archivovanej dokumentacie", znacka drzi H = 2,05 s; scena 12,45 s.
 * Kolo 28: texty v obraze (2500 "Hladanie trva...", 4700 "Zaplatene dvakrat..."),
 * predel posunuty o D, znacka drzi o H dlhsie a pod lockupom je popis. 11,1 s.
 */
const D = 1300; // posun predelu, aby sa dal precitat text pod "2x"
const H = 2050; // drzanie znacky s textom pod lockupom (kolo 36: bez nahovoru, ~3,5 s na citanie)
const BOX = 860;
export const C4_Cena: React.FC = () => {
  const frame = useCurrentFrame();
  const showCap = useCaptions(); // kolo 29: vety nesie nahovor + titulky (Paced)
  const tw = (s: number, d: number) => tween(frame, s, d);
  const bigQ = pop(frame, 1100);
  const clock = settle(frame, 2600);
  const hand = (useOutputFrame() / 30) * 300; // kolo 33: rucicka tika plynulo podla skutocneho casu klipu, aj pocas pauz
  const arrow = tw(3000, 500);
  const sheet = settle(frame, 3200);
  const tagB = pop(frame, 3600);
  const tagA = pop(frame, 3900);
  const big = pop(frame, 4400, { damping: 12 });
  const s = TARGET_SHELF;
  // predel problem -> riesenie
  const out = 1 - tw(5600 + D, 500); // cenovky, hodiny, vykres, "?" vyblednu
  const light = tw(5600 + D, 600); // kolo 34: po "2x" rovno prelinacka do bielej (bez navratu kamery na policu)
  const mark = settle(frame, 6300 + D); // znacka sa objavi (bez kreslenia)
  const lockup = settle(frame, 6450 + D);
  const brandOut = tw(7900 + D + H, 300);
  const box = settle(frame, 8100 + D + H);
  const footer = tw(8200 + D + H, 400);
  const CAM_MID = { x: CAM_END.x + 590 / CAM_END.scale, y: CAM_END.y + 70 / CAM_END.scale, scale: 1.5 };
  const boxLeft = C5_BOX_LEFT; // rovnaka poloha ako v C5 (krabica vlavo, vpravo kroky)
  const boxTop = SAFE.illoTop - 40;
  return (
    <Scene mode="dark" footer footerMode="light" footerOpacity={footer}>
      <Camera keys={[{ ms: 0, ...CAM_END }, { ms: 1700, ...CAM_MID }]}>
        <svg width={1920} height={1080} viewBox={`${VB.x} ${VB.y} ${1920 / SV} ${1080 / SV}`} style={{ position: 'absolute', left: 0, top: 0 }}>
          <ShelfFrame x={s.x} y={s.y} w={CM.shelf.w} d={CM.shelf.d} levels={2} levelH={CM.shelf.level} topBoard={false}>
            {(lvl) => [0, 1].map((k) => <Carton key={`${lvl}${k}`} x={s.x + 8 + k * 60} y={s.y + 12} z={lvl * CM.shelf.level + 4} />)}
          </ShelfFrame>
          {(() => {
            const [qx, qy] = iso(s.x + 65, s.y + 30, 2 * CM.shelf.level + 14);
            return <QuestionMark x={qx} y={qy} s={0} />; // bez otaznika nad policou; otaznik je vedla regalu (kolo 37)
          })()}
        </svg>
      </Camera>

      {/* kolo 37: velky otaznik vedla regalu je spat (v kole 36 chybal, medzi regalom a hodinami ostala diera);
          kreslenie ako QuestionMark z C2 (rovnaky kruh a znak), velkost ako hodiny */}
      <svg width={240} height={240} viewBox="-120 -120 240 240" style={{ position: 'absolute', left: 715, top: 380, opacity: out, transform: `scale(${0.6 + 0.4 * bigQ})` }}>
        <QuestionMark x={0} y={0} s={bigQ * (100 / 18)} />
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
      {/* 2x EUR dole v strede, medzi cenovkami (kolo 36: jeden text, jedno EUR, na stred) */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', opacity: big * out, transform: `scale(${0.6 + 0.4 * big})`, whiteSpace: 'nowrap', fontFamily: FONT.display, fontWeight: 800, fontSize: 170, lineHeight: 0.9, color: BRAND[400], letterSpacing: '-0.03em' }}>
        2×€
      </div>
      {showCap ? (
        <>
          <Caption text={captions.C4a} mode="dark" t={settle(frame, 2500)} out={tw(4300, 300)} y={SAFE.captionY} />
          <Caption text={captions.C4} mode="dark" t={settle(frame, 4700)} out={tw(5500 + D, 300)} y={SAFE.captionY} />
        </>
      ) : null}

      {/* prechod do bielej: cista prelinacka (bez svetelneho efektu) */}
      {light > 0 ? <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: light, pointerEvents: 'none' }} /> : null}

      {/* znacka Assetin + lockup z design kitu (assetin / .space | Archives), svetla verzia */}
      {mark > 0 ? (
        <div style={{ position: 'absolute', inset: 0, opacity: (1 - brandOut) * Math.min(1, mark * 1.2), transform: `scale(${(1 - 0.06 * brandOut) * (0.97 + 0.03 * mark)})`, transformOrigin: '50% 50%' }}>
          {(() => {
            const k = 0.6;
            const left = 960 - (LOCKUP_W * k) / 2;
            const top = 420;
            const stackLeft = 0,
              sepLeft = LOCKUP.stackW + LOCKUP.gap,
              modLeft = sepLeft + LOCKUP.sepW + LOCKUP.gap;
            return (
              <div style={{ position: 'absolute', left, top, width: LOCKUP_W * k, height: LOCKUP.sepH * k, opacity: lockup, transform: `translateY(${(1 - lockup) * 10}px)` }}>
                <div style={{ position: 'absolute', left: 0, top: 0, transform: `scale(${k})`, transformOrigin: '0 0', width: LOCKUP_W, height: LOCKUP.sepH }}>
                  <div style={{ position: 'absolute', left: stackLeft, top: -2 }}>
                    <BrandStack light />
                  </div>
                  <div style={{ position: 'absolute', left: sepLeft, top: 0 }}>
                    <BrandSep light />
                  </div>
                  <div style={{ position: 'absolute', left: modLeft, top: -30 }}>
                    <BrandMod light />
                  </div>
                </div>
              </div>
            );
          })()}
          {/* kolo 36: popis pod lockupom (vetu uz nehovori nahovor) */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: 590, textAlign: 'center', fontFamily: FONT.display, fontWeight: 600, fontSize: 46, color: NAVY[800], letterSpacing: '-0.01em', opacity: settle(frame, 6750 + D), transform: `translateY(${(1 - settle(frame, 6750 + D)) * 12}px)` }}>
            {captions.C4brand}
          </div>
        </div>
      ) : null}

      {/* krabica z C5 sa usadi na podstavec = prvy frame C5 */}
      {box > 0 ? <ArchiveBox state={archiveBoxClosed} size={BOX} style={{ position: 'absolute', left: boxLeft, top: boxTop, opacity: box, transform: `translateY(${(1 - box) * 30}px)` }} /> : null}
    </Scene>
  );
};
