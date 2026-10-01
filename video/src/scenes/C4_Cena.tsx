import React from 'react';
import { Easing, useCurrentFrame } from 'remotion';
import { Scene, useCaptions } from '../components/Scene';
import { Lockup } from '../components/ArchivesBrand';
import { OfferIcon, OfferIconKind } from '../components/ArchivesIcons';
import { voAt } from '../components/Subtitles';
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
/**
 * Kolo 49 (Samuel: dlhu verziu znackovo zjednotit s kratkou LinkedIn verziou): prechod do loga ako v kratkej (kolo 13
 * tam): zdola nahor najprv zeleny pas znacky, WHITE_AFTER ms za nim biely (WIPE_MS, makka horna hrana WIPE_FEATHER),
 * namiesto bielej prelinacky. Logo je oficialne dvojriadkove (Lockup) a posklada sa, ked biela prejde jeho miesto;
 * slogan "Digitalny poriadok v papierovom archive" pod nim ako siva veta (Inter 500), nie zelene verzalky.
 * Plati len s `brand` (hlavna verzia); kratka verzia (brand = false) ma bielu prelinacku ako doteraz.
 */
const WIPE_MS = 800;
const WIPE_FEATHER = 110;
const WHITE_AFTER = 220;
const WIPE_EASE = Easing.bezier(0.45, 0, 0.25, 1);
const LOGO_H = 200; // vyska loga (sirka ~790 px)
const LOGO_TOP = 280; // kolo 52: o 70 px vyssie, pod sloganom su ikony Vas archiv -> Digitalny katalog
const D_MAIN = 1300; // posun predelu, aby sa dal precitat text pod "2x"
const H_MAIN = 6250; // kolo 51: premostenie "S nami ho najdete za par sekund." pred logom a pri logu "Predstavujeme vam Assetin Archives. Z vasho archivu urobime prehladny digitalny katalog." (12,75-19,3 s vystupu); predtym 3780 // drzanie znacky: kolo 40 znova veta "Predstavujeme vam softverove riesenie katalogizacie Assetin Archives." (15,5-20,1 s vystupu) + text pod lockupom
const BOX = 860;
/** ms sceny (hlavna verzia): zaciatok prechodu do loga, biela zakryje obraz, logo odide (pre logo v rohu v scenesList). */
export const C4_WIPE_AT = 5600 + D_MAIN;
export const C4_WHITE_FULL = C4_WIPE_AT + WHITE_AFTER + WIPE_MS;
export const C4_BRAND_END = 7900 + D_MAIN + H_MAIN + 300;
/**
 * Experiment kratkej verzie: `d` = posun predelu, `h` = drzanie znacky (ms), `brand` = false: bez lockupu a textu pod nim
 * (LinkedIn 4:5 kresli vlastne logo na vysku), `cost` = false: bez sipky, vykresu, cenoviek a "2x EUR" (len regal,
 * otaznik a hodiny), `clockAt` = kedy sa objavia hodiny (ms sceny); predvolene hlavna verzia.
 */
export const C4_Cena: React.FC<{ d?: number; h?: number; brand?: boolean; cost?: boolean; clockAt?: number }> = ({ d: D = D_MAIN, h: H = H_MAIN, brand = true, cost = true, clockAt = 2600 }) => {
  const frame = useCurrentFrame();
  const showCap = useCaptions(); // kolo 29: vety nesie nahovor + titulky (Paced)
  const tw = (s: number, d: number) => tween(frame, s, d);
  const bigQ = pop(frame, 1100);
  const clock = settle(frame, clockAt);
  const hand = (useOutputFrame() / 30) * 300; // kolo 33: rucicka tika plynulo podla skutocneho casu klipu, aj pocas pauz
  const arrow = tw(3000, 500);
  const sheet = settle(frame, 3200);
  const tagB = pop(frame, 3600);
  const tagA = pop(frame, 3900);
  const big = pop(frame, 4400, { damping: 12 });
  const s = TARGET_SHELF;
  // predel problem -> riesenie
  const out = 1 - tw(5600 + D, 500); // cenovky, hodiny, vykres, "?" vyblednu
  const light = brand ? 0 : tw(5600 + D, 600); // kolo 34: po "2x" rovno prelinacka do bielej (kratka verzia)
  const ms = (frame / 30) * 1000;
  const wipe = (at: number) => WIPE_EASE(Math.min(1, Math.max(0, (ms - at) / WIPE_MS)));
  const g = brand ? wipe(5600 + D) : 0; // kolo 49: zeleny pas zdola
  const w = brand ? wipe(5600 + D + WHITE_AFTER) : 0; // biely za nim
  const build = 5600 + D + WHITE_AFTER + Math.round(0.55 * WIPE_MS); // logo sa zacne skladat, ked biela prejde jeho miesto
  const tag = tween(frame, build + 650, 900, Easing.bezier(0.16, 1, 0.3, 1));
  const brandOut = tw(7900 + D + H, 300);
  const box = settle(frame, 8100 + D + H);
  const CAM_MID = { x: CAM_END.x + 590 / CAM_END.scale, y: CAM_END.y + 70 / CAM_END.scale, scale: 1.5 };
  const boxLeft = C5_BOX_LEFT; // rovnaka poloha ako v C5 (krabica vlavo, vpravo kroky)
  const boxTop = SAFE.illoTop - 40;
  return (
    <Scene mode="dark">
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
      <svg width={180} height={80} viewBox="0 0 180 80" style={{ position: 'absolute', left: 1200, top: 460, opacity: cost && arrow > 0 ? out : 0 }}>
        <path d="M10 40 H150" fill="none" stroke={BRAND[400]} strokeWidth={8} strokeLinecap="round" {...drawProps(arrow, 140)} />
        <path d="M122 12 L156 40 L122 68" fill="none" stroke={BRAND[400]} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" opacity={arrow > 0.85 ? 1 : 0} />
      </svg>

      {cost ? (
        <>
      <div style={{ position: 'absolute', left: 300, top: 720, opacity: out }}>
        <PriceTag text="skladovanie" s={tagA} color={BRAND[700]} size={36} />
      </div>
      <div style={{ position: 'absolute', left: 1395, top: 300, opacity: sheet * out, transform: `translateY(${(1 - sheet) * 30}px) rotate(-4deg)` }}>
        <Sheet w={280} h={390} lines={7} stamp />
      </div>
      <div style={{ position: 'absolute', left: 1395, top: 720, opacity: out }}>
        <PriceTag text="nové vyhotovenie" s={tagB} color={BRAND[700]} size={36} />
      </div>
        </>
      ) : null}
      {/* 2x EUR dole v strede, medzi cenovkami (kolo 36: jeden text, jedno EUR, na stred) */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', opacity: cost ? big * out : 0, transform: `scale(${0.6 + 0.4 * big})`, whiteSpace: 'nowrap', fontFamily: FONT.display, fontWeight: 800, fontSize: 170, lineHeight: 0.9, color: BRAND[400], letterSpacing: '-0.03em' }}>
        2×€
      </div>
      {showCap ? (
        <>
          <Caption text={captions.C4a} mode="dark" t={settle(frame, 2500)} out={tw(4300, 300)} y={SAFE.captionY} />
          <Caption text={captions.C4} mode="dark" t={settle(frame, 4700)} out={tw(5500 + D, 300)} y={SAFE.captionY} />
        </>
      ) : null}

      {/* prechod do bielej: cista prelinacka (kratka verzia), v hlavnej zeleny a biely pas zdola (kolo 49) */}
      {light > 0 ? <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: light, pointerEvents: 'none' }} /> : null}
      {g > 0 && w < 1 ? <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1080 * g + WIPE_FEATHER, background: `linear-gradient(to top, ${BRAND[600]} calc(100% - ${WIPE_FEATHER}px), rgba(31,122,51,0) 100%)`, pointerEvents: 'none' }} /> : null}
      {w > 0 ? <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: w < 1 ? 1080 * w + WIPE_FEATHER : 1080, background: w < 1 ? `linear-gradient(to top, #fff calc(100% - ${WIPE_FEATHER}px), rgba(255,255,255,0) 100%)` : '#fff', pointerEvents: 'none' }} /> : null}

      {/* kolo 49: oficialne dvojriadkove logo Assetin Archives (sklada sa) a slogan pod nim */}
      {brand && ms >= build && brandOut < 1 ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: LOGO_TOP, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 1 - brandOut, transform: `scale(${1 - 0.06 * brandOut})` }}>
          <Lockup height={LOGO_H} build={build} />
          <div style={{ marginTop: 44, fontFamily: FONT.body, fontWeight: 500, fontSize: 40, color: INK[600], opacity: tag, transform: `translateY(${(1 - tag) * 10}px)`, whiteSpace: 'nowrap' }}>{captions.C4brand}</div>
        </div>
      ) : null}

      {brand && brandOut < 1 ? <C4Promise out={brandOut} /> : null}

      {/* krabica z C5 sa usadi na podstavec = prvy frame C5 */}
      {box > 0 ? <ArchiveBox state={archiveBoxClosed} size={BOX} style={{ position: 'absolute', left: boxLeft, top: boxTop, opacity: box, transform: `translateY(${(1 - box) * 30}px)` }} /> : null}
    </Scene>
  );
};

/**
 * Kolo 52 (Samuel: preniest do dlhej aj zvysok obrazu kratkej verzie): pod logom pri vete "Z vasho archivu urobime
 * prehladny digitalny katalog" Vas archiv -> Digitalny katalog ako v kratkej (kolo 8 tam): ikona pri slove "archivu",
 * sipka pri "urobime", katalog pri "prehladny"; odide spolu s logom. Casy v case vystupu (useOutputFrame, scena v tom
 * case stoji v pauze), slova z public/vo/lines/C4-Cena-3.words.json.
 */
const PROMISE_TOP = 640;
const C4_W3 = { archivu: 3.36, urobime: 3.88, prehladny: 4.44 };
const C4Promise: React.FC<{ out: number }> = ({ out }) => {
  const of = useOutputFrame();
  const L = voAt('C4-Cena', 3);
  const arch = settle(of, L + C4_W3.archivu * 1000 - 150);
  const arrow = tween(of, L + C4_W3.urobime * 1000 - 100, 450);
  const cat = settle(of, L + C4_W3.prehladny * 1000 - 150);
  if (arch <= 0.001 || out >= 1) return null;
  const item = (icon: OfferIconKind, label: string, t: number) => (
    <div style={{ width: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: t, transform: `translateY(${(1 - t) * 18}px)` }}>
      <OfferIcon kind={icon} on size={120} />
      <div style={{ marginTop: 16, fontFamily: FONT.display, fontWeight: 700, fontSize: 34, color: INK[900], whiteSpace: 'nowrap' }}>{label}</div>
    </div>
  );
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: PROMISE_TOP, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', opacity: 1 - out }}>
      {item('box', 'Váš archív', arch)}
      <svg width={170} height={124} viewBox="0 0 170 124" style={{ flex: 'none' }}>
        <path d="M16 62 H146" fill="none" stroke={BRAND[500]} strokeWidth={7} strokeLinecap="round" strokeDasharray={130} strokeDashoffset={130 * (1 - arrow)} />
        <path d="M126 42 L150 62 L126 82" fill="none" stroke={BRAND[500]} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" opacity={arrow > 0.85 ? 1 : 0} />
      </svg>
      {item('catalog', 'Digitálny katalóg', cat)}
    </div>
  );
};
