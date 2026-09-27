import React from 'react';
import { AbsoluteFill, OffthreadVideo, Series, staticFile, useCurrentFrame } from 'remotion';
import { LogoMark, SceneFrameContext } from '../../components/Scene';
import { voLines } from '../../components/Subtitles';
import { FOOTAGE_PHONE, PHONE_BEZEL, PhoneFrame, Rect } from '../../components/Device';
import { BrandMod, BrandSep, BrandStack, LOCKUP, LOCKUP_W } from '../../components/Brand';
import { C2_Hladanie } from '../C2_Hladanie';
import { C5_Teren } from '../C5_Teren';
import { Card } from '../C8_Pilot';
import { DesktopFootageClip } from '../F2_Metadata';
import { CTA, C5_STEPS, K_C4, K_C4_D, K_C4_H, K_F1_SECONDS, K_F1_TAPS, K_F24_MARKS, K_F24_SECONDS, K_F24_STEPS, K_F24_TAPS, K_F3_SECONDS, PHASE_ARCHIV, SOFTWARE_DESC, c4End, f3Marks, f3Steps } from './Kratka';
import { K_C4_HOLDS, paced } from '../../kratkaList';
import type { SceneDef } from '../../scenesList';
import { easeInOut, pop, settle, tween } from '../../lib/anim';
import { loadFonts } from '../../lib/fonts';
import { captions, offer, phases, sk } from '../../copy/sk';
import { voAt } from '../../components/Subtitles';
import { BRAND, FONT, FPS, INK, NAVY } from '../../theme';

/**
 * Experiment: kratka verzia pre LinkedIn na vysku 4:5 (1080 x 1350). Kolo 2 (Samuel): jedina kratka verzia,
 * aplikaciu ma byt dostatocne vidiet a nemaju byt stale orezane okraje. Preto:
 * - zaznamy aplikacie su nativne na vysku: okno na celu sirku (obsah 1032 x 516, cely zaznam bez priblizenia),
 *   mobil velky na stred; pod oknom zvacseny detail skutocneho zaznamu (text na fotke, navrh, slovo, polica
 *   a krabica), aby sa dal precitat aj na mobile,
 * - animovane scény 16:9 (C2, C4, C5) su v pase na celu sirku a ich pozadie siaha cez celu plochu (bez okraja pasu),
 * - C8 (karty pod sebou) a C9 su nakreslene na vysku,
 * - nad obrazom maly riadok znacky a nazov kroku, pod obrazom velke titulky (58 px, na mobile ~20 px), dole web.
 * Hlas a titulky ako v kratkej verzii 16:9 (src/copy/vo_kratka.json), hudba mix-music.mjs --video.
 */
export const LI = { w: 1080, h: 1350 };
const S169 = LI.w / 1920; // mierka sceny 16:9 v pase
const BAND = { y: 271, h: 608 };
/** Okno aplikacie: obsah 1032 x 516 = pomer orezaneho zaznamu 1764 x 882 (2:1), lista 44 px. */
const WIN: Rect = { x: 24, y: 222, w: 1032, h: 516 + 44 };
const CALL_Y = 804; // zvacseny detail pod oknom (do ~1060)
const SUB_Y = 1080; // velke titulky
/** Zaznam aplikacie (px orezaneho zaznamu). */
const REC = { w: 1764, h: 882 };

type Tone = 'dark' | 'light';
type LiDef = {
  def: [string, SceneDef];
  band?: boolean;
  tone: (ms: number) => Tone;
  toWhite?: number; // ms: pozadie prejde z tmavej do bielej spolu so scenou (C4)
  steps?: { from: number; title: string }[]; // ms, nazov kroku nad obrazom
  phase?: string;
  shift?: (ms: number) => { x: number; y: number }; // posun pasu 16:9 (px ramca)
  win?: Win; // okno pasu (predvolene BAND s makkymi okrajmi)
  overflow?: boolean; // obsah sceny smie presiahnut ramec 16:9 az po okraj okna (C5: veko krabice pri priblizeni)
  chrome?: boolean; // false = bez riadku znacky a webu (C9 ich ma vo vlastnom rozlozeni)
};
/**
 * Okno, cez ktore vidno pas 16:9 (px ramca): hore/dole makky prechod `feather` px do pozadia ramca, aby obsah
 * prechadzajuci okrajom (prestrih v C2, priblizenie) nemal ostru rovnu hranu. Pozadie sceny = pozadie ramca, takze
 * samotny okraj nie je vidiet. Predvolene okno = pas; 26 px sa nedotkne obsahu v pokoji (C2 od 310 do 850 px).
 */
type Win = { top: number; bottom: number; feather: number };
const BAND_WIN: Win = { top: BAND.y, bottom: BAND.y + BAND.h, feather: 26 };

/** Riadok znacky vlavo hore (ako paticka scén 16:9). */
const BrandRow: React.FC<{ tone: Tone }> = ({ tone }) => (
  <div style={{ position: 'absolute', left: 48, top: 40, display: 'flex', alignItems: 'center', gap: 14, fontFamily: FONT.body, fontSize: 28, color: tone === 'dark' ? NAVY[200] : INK[500] }}>
    <LogoMark size={34} color={tone === 'dark' ? '#fff' : BRAND[700]} />
    <span style={{ width: 2, height: 28, background: tone === 'dark' ? NAVY[700] : INK[200] }} />
    <span style={{ fontFamily: FONT.display, fontWeight: 700, color: tone === 'dark' ? '#fff' : INK[900] }}>
      asset<span style={{ color: tone === 'dark' ? BRAND[400] : BRAND[600] }}>in</span>
    </span>
    <span style={{ width: 2, height: 28, background: tone === 'dark' ? NAVY[700] : INK[200] }} />
    <span>Archives</span>
  </div>
);

/** Nazov kroku nad obrazom (rovnaky jazyk ako panel krokov v 16:9: faza + nazov + body postupu). */
const StepLabel: React.FC<{ steps: { from: number; title: string }[]; phase?: string; frame: number }> = ({ steps, phase, frame }) => {
  const ms = (frame / FPS) * 1000;
  const idx = Math.max(0, steps.findIndex((s, i) => ms >= s.from && (i === steps.length - 1 || ms < steps[i + 1].from)));
  return (
    <>
      {steps.map((s, i) => {
        const inT = settle(frame, s.from);
        return (
          <div key={i} style={{ position: 'absolute', left: 48, right: 48, top: 104, opacity: (i === idx ? 1 : 0) * inT, transform: `translateY(${(1 - inT) * 12}px)` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: FONT.body, fontWeight: 600, fontSize: 22, letterSpacing: '0.14em', textTransform: 'uppercase', color: BRAND[600], marginBottom: 8 }}>
              {phase}
              {steps.length > 1 ? (
                <span style={{ display: 'flex', gap: 8 }}>
                  {steps.map((_, k) => (
                    <span key={k} style={{ width: k <= i ? 26 : 10, height: 10, borderRadius: 5, background: k <= i ? BRAND[500] : INK[200] }} />
                  ))}
                </span>
              ) : null}
            </div>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 52, lineHeight: 1.04, letterSpacing: '-0.02em', color: INK[900] }}>{s.title}</div>
          </div>
        );
      })}
    </>
  );
};

/** Velke titulky pod obrazom: casy a casti ako Subtitles (vo_kratka.json), biela na tmavom, ink na svetlom. */
const BigSubtitles: React.FC<{ clip: string; tone: Tone }> = ({ clip, tone }) => {
  const frame = useCurrentFrame();
  const ms = (frame / FPS) * 1000;
  const lines = voLines(clip);
  const cur = lines.find((l) => ms >= l.at && ms < l.at + Math.max(1200, (l.dur ?? 1500) + 250));
  if (!cur) return null;
  const k = cur.parts && cur.partAt ? Math.max(0, cur.partAt.filter((p) => ms - cur.at >= p).length - 1) : -1;
  const text = k >= 0 ? cur.parts![k] : cur.text;
  const start = cur.at + (k >= 0 ? cur.partAt![k] : 0);
  const t = Math.min(1, (ms - start) / 180);
  return (
    <div style={{ position: 'absolute', left: 56, right: 56, top: SUB_Y, textAlign: 'center', fontFamily: FONT.display, fontWeight: 700, fontSize: 58, lineHeight: 1.18, letterSpacing: '-0.01em', color: tone === 'dark' ? '#fff' : INK[900], opacity: t, transform: `translateY(${(1 - t) * 10}px)` }}>
      {text}
    </div>
  );
};

const Web: React.FC<{ tone: Tone }> = ({ tone }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, bottom: 44, textAlign: 'center', fontFamily: FONT.body, fontWeight: 600, fontSize: 28, color: tone === 'dark' ? BRAND[200] : BRAND[700] }}>{sk.S12.web}</div>
);

/**
 * Zvacseny detail skutocneho zaznamu pod oknom (lupa): region v px orezaneho zaznamu, zivy obraz (pisanie
 * slova vidno aj v detaile). Zeleny ramik ako spot v okne, nad nim kratky stitok. `notes` = popisky pod detailom
 * (x v px zaznamu), napr. polica / krabica / zlozka pod PL_01 / KR_01 / ZL_03.
 */
const Callout: React.FC<{ src: string; region: { x: number; y: number; w: number; h: number }; from: number; to: number; label: string; width: number; notes?: { x: number; text: string }[] }> = ({ src, region, from, to, label, width, notes }) => {
  const frame = useCurrentFrame();
  const a = settle(frame, from * 1000) * (1 - tween(frame, to * 1000 - 250, 250));
  if (a <= 0.001) return null;
  const k = width / region.w;
  const h = region.h * k;
  return (
    <div style={{ position: 'absolute', left: (LI.w - width) / 2, top: CALL_Y, width, opacity: a, transform: `translateY(${(1 - a) * 14}px)` }}>
      <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 22, letterSpacing: '0.14em', textTransform: 'uppercase', color: BRAND[600], marginBottom: 10 }}>{label}</div>
      <div style={{ position: 'relative', width, height: h, borderRadius: 14, overflow: 'hidden', border: `3px solid ${BRAND[400]}`, boxSizing: 'content-box', boxShadow: '0 14px 36px rgba(15,23,42,0.14)', background: '#fff' }}>
        <OffthreadVideo src={staticFile(src)} muted style={{ position: 'absolute', left: -region.x * k, top: -region.y * k, width: REC.w * k, height: REC.h * k, maxWidth: 'none' }} />
      </div>
      {notes?.map((n) => (
        <div key={n.text} style={{ position: 'absolute', left: 3 + (n.x - region.x) * k, top: 32 + h + 16, transform: 'translateX(-50%)', fontFamily: FONT.display, fontWeight: 700, fontSize: 30, color: BRAND[700], whiteSpace: 'nowrap' }}>
          {n.text}
        </div>
      ))}
    </div>
  );
};

/** C5 v 16:9 ma krabicu vlavo (vpravo bol panel krokov): na vysku sa pas na zaciatku plynulo posunie, krabica je na strede. */
const C5_SHIFT = 186;
/** Pas C5 o kusok nizsie: veko krabice pri priblizeni kamery ostane cele pod nadpisom kroku (okno od 206 px). */
const C5_DY = 60;
const c5Ease = (ms: number) => easeInOut(Math.min(1, Math.max(0, ms / 700)));
const c5Shift = (ms: number) => ({ x: C5_SHIFT * c5Ease(ms), y: C5_DY * c5Ease(ms) });

/** F1 na vysku: mobil z pozicie na konci C5 (v pase) narastie na velky mobil na stred, potom skutocny fotoaparat. */
const PHONE_FROM: Rect = { x: C5_SHIFT + FOOTAGE_PHONE.x * S169, y: BAND.y + C5_DY + FOOTAGE_PHONE.y * S169, w: FOOTAGE_PHONE.w * S169, h: FOOTAGE_PHONE.h * S169 };
const PHONE_TO: Rect = { x: (LI.w - 442) / 2, y: 222, w: 442, h: 800 };
const REC_PHONE = { w: 884, h: 1920, cropTop: 115 / 1920 }; // zaznam mobilu a orez stavovej listy iOS (ako F1)
const LI_F1: React.FC = () => {
  const frame = useCurrentFrame();
  const g = easeInOut(Math.min(1, Math.max(0, frame / (0.45 * FPS))));
  const at: Rect = {
    x: PHONE_FROM.x + (PHONE_TO.x - PHONE_FROM.x) * g,
    y: PHONE_FROM.y + (PHONE_TO.y - PHONE_FROM.y) * g,
    w: PHONE_FROM.w + (PHONE_TO.w - PHONE_FROM.w) * g,
    h: PHONE_FROM.h + (PHONE_TO.h - PHONE_FROM.h) * g,
  };
  const screenIn = tween(frame, 0, 300);
  const fadeOut = tween(frame, K_F1_SECONDS * 1000 - 500, 400);
  const videoW = at.w * (1 - 2 * PHONE_BEZEL);
  const videoH = (videoW * REC_PHONE.h) / REC_PHONE.w;
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      <PhoneFrame at={at}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#fff' }}>
          <div style={{ position: 'absolute', left: 0, top: -REC_PHONE.cropTop * videoH, width: videoW, height: videoH }}>
            <OffthreadVideo src={staticFile('footage/k-f1-sken.mp4')} muted style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
            {K_F1_TAPS.map((tp, i) => {
              const t = tween(frame, tp.t * 1000, 550);
              if (t <= 0 || t >= 1) return null;
              const r = (18 + 70 * t) * (at.w / FOOTAGE_PHONE.w);
              return <div key={i} style={{ position: 'absolute', left: tp.x * videoW - r, top: tp.y * videoH - r, width: 2 * r, height: 2 * r, borderRadius: '50%', border: `3px solid ${BRAND[400]}`, background: `rgba(79,168,90,${0.28 * (1 - t)})`, opacity: 1 - t * t }} />;
            })}
          </div>
          <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 1 - screenIn }} />
        </div>
      </PhoneFrame>
      <AbsoluteFill style={{ background: '#fff', opacity: fadeOut }} />
    </AbsoluteFill>
  );
};

/**
 * F24 na vysku: cely zaznam v okne na celu sirku (bez priblizenia) a pod nim detail: text na fotke, potom navrh
 * aplikacie (Nazov projektu), pocas overenia a potvrdenia ostava, pri vete o fotke znova text na fotke.
 */
const kv = (i: number, k = 0) => voAt('K-F24-Aplikacia', i, k) / 1000;
const F24_SRC = 'footage/k-f24-review.mp4';
const PHOTO_TITLE = { x: 222, y: 432, w: 162, h: 38 }; // "Novostavba bytoveho domu / SLNECNA 12, BRATISLAVA" na fotke
const VALUE = { x: 722, y: 484, w: 448, h: 54 }; // Hodnota: navrh pre Nazov projektu
const LI_F24: React.FC = () => (
  <AbsoluteFill>
    <DesktopFootageClip src={F24_SRC} seconds={K_F24_SECONDS} steps={[]} taps={K_F24_TAPS} marks={K_F24_MARKS} win={WIN} enter />
    <Callout src={F24_SRC} region={PHOTO_TITLE} from={0.5} to={kv(0, 1) + 0.1} label="Na fotke" width={640} />
    <Callout src={F24_SRC} region={VALUE} from={kv(0, 1) + 0.35} to={kv(1, 1) - 0.1} label="Návrh aplikácie: názov projektu" width={940} />
    <Callout src={F24_SRC} region={PHOTO_TITLE} from={kv(1, 1) + 0.1} to={K_F24_SECONDS - 0.5} label="Fotka pri zázname" width={640} />
  </AbsoluteFill>
);

/** F3 na vysku: cely zaznam v okne, pod nim hladane slovo (zivo, ako sa pise), potom cesta s popiskami polica / krabica / zlozka. */
const F3_CLIP = 'K-F3-Vyhladavanie';
const F3_SRC = 'footage/k-f3-search.mp4';
const SEARCH = { x: 40, y: 424, w: 400, h: 68 }; // pole s napisanym slovom vodovod
const CRUMB = { x: 470, y: 628, w: 280, h: 40 }; // ⌂ / PL_01 / KR_01 / ZL_03
const LI_F3: React.FC = () => {
  const v = (k: number) => voAt(F3_CLIP, 0, k) / 1000;
  return (
    <AbsoluteFill>
      <DesktopFootageClip src={F3_SRC} seconds={K_F3_SECONDS} steps={[]} phase={phases.search} marks={f3Marks(F3_CLIP)} win={WIN} enter />
      <Callout src={F3_SRC} region={SEARCH} from={0.4} to={v(1) + 0.4} label="Hľadané slovo" width={880} />
      <Callout
        src={F3_SRC}
        region={CRUMB}
        from={v(1) + 0.9}
        to={K_F3_SECONDS - 0.5}
        label="Kde dokument leží"
        width={880}
        notes={[
          { x: 556, text: 'polica' },
          { x: 633.5, text: 'krabica' },
          { x: 716, text: 'zložka' },
        ]}
      />
    </AbsoluteFill>
  );
};

/** C8 na vysku: karty pod sebou, 1,3x (na sirku by na mobile mali nazov ~9 px, takto ~22 px). */
const C8_K = 1.3;
const LI_C8: React.FC = () => {
  const frame = useCurrentFrame();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const soft = voAt('K-C8-Ponuka', 1);
  const dimService = 0.45 * tw(soft + 100, 400) * (1 - tw(soft + 2500, 400));
  const w = 680 * C8_K;
  const x = (LI.w - w) / 2;
  const card = (y: number, el: React.ReactNode) => (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: 236 * C8_K }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 680, height: 236, transform: `scale(${C8_K})`, transformOrigin: '0 0' }}>{el}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      <div style={{ position: 'absolute', left: x, width: w, top: 226, display: 'flex', alignItems: 'center', gap: 18, opacity: settle(frame, 0) }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 28, letterSpacing: '0.16em', textTransform: 'uppercase', color: BRAND[600], whiteSpace: 'nowrap' }}>{offer.kicker}</div>
        <div style={{ flex: 1, height: 2, background: INK[200] }} />
      </div>
      {card(290, <Card x={0} y={0} t={settle(frame, 100)} dim={dimService} main icon="box" title={offer.service.title} desc={offer.service.desc} step={offer.service.step} stepT={pop(frame, voAt('K-C8-Ponuka', 0, 1) + 250)} />)}
      {card(290 + 236 * C8_K + 44, <Card x={0} y={0} t={settle(frame, soft)} dim={0} icon="app" title={offer.software.title} desc={SOFTWARE_DESC} step={offer.software.step} stepT={pop(frame, soft + 1700)} />)}
    </AbsoluteFill>
  );
};

/** C9 na vysku: lockup, slogan, vyzva a web vacsie (na mobile citatelne), firma mensia. */
const LI_C9: React.FC = () => {
  const frame = useCurrentFrame();
  React.useEffect(() => {
    loadFonts();
  }, []);
  const logo = settle(frame, 200);
  const tag = settle(frame, 700);
  const firm = settle(frame, 1100);
  const K = 0.66;
  const sepLeft = LOCKUP.stackW + LOCKUP.gap;
  const modLeft = sepLeft + LOCKUP.sepW + LOCKUP.gap;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${BRAND[800]} 0%, ${BRAND[600]} 100%)`, alignItems: 'center', fontFamily: FONT.body, color: '#fff' }}>
      <div style={{ marginTop: 250, width: LOCKUP_W * K, height: LOCKUP.sepH * K, position: 'relative', opacity: logo, transform: `translateY(${(1 - logo) * 14}px) scale(${0.96 + 0.04 * logo})` }}>
        <div style={{ position: 'absolute', left: 0, top: 0, transform: `scale(${K})`, transformOrigin: '0 0', width: LOCKUP_W, height: LOCKUP.sepH }}>
          <div style={{ position: 'absolute', left: 0, top: -2 }}>
            <BrandStack inColor={BRAND[200]} />
          </div>
          <div style={{ position: 'absolute', left: sepLeft, top: 0 }}>
            <BrandSep />
          </div>
          <div style={{ position: 'absolute', left: modLeft, top: -30 }}>
            <BrandMod />
          </div>
        </div>
      </div>
      <div style={{ marginTop: 40, width: 900, textAlign: 'center', fontFamily: FONT.display, fontWeight: 600, fontSize: 44, lineHeight: 1.2, opacity: tag, transform: `translateY(${(1 - tag) * 14}px)` }}>{captions.C4brand}</div>
      <div style={{ width: 70, height: 5, background: BRAND[300], borderRadius: 3, marginTop: 52, opacity: firm }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 46, opacity: firm, transform: `translateY(${(1 - firm) * 14}px)` }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 64, lineHeight: 1.05, letterSpacing: '-0.015em' }}>{CTA}</div>
        <div style={{ marginTop: 16, fontSize: 48, fontWeight: 700, lineHeight: 1.1, color: BRAND[100] }}>{sk.S12.web}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 40, opacity: 0.85 }}>
          <LogoMark size={40} color="#fff" />
          <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 32, lineHeight: 1 }}>{sk.S12.company}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** F1 pokracuje krokom z konca C5 (2. z 2, uz usadeny), aby nadpis na strihu neblikol. */
const F1_STEPS = [
  { from: -9999, title: 'Prilepiť QR kód' },
  { from: -2000, title: 'Odfotiť titulnú stranu' },
];
/** Klipy verzie 4:5 (rovnake ID a casy hlasu ako kratka verzia 16:9, titulky kresli ramec). */
const noSubs = { subtitles: false };
const C5_BAND: React.FC = () => <C5_Teren steps={[]} />; // kroky su nad obrazom, nie v scene
const LI_LIST: LiDef[] = [
  { def: paced('K-C2-Hladanie', { scene: C2_Hladanie, seconds: 10, stills: [], ...noSubs }), band: true, tone: () => 'dark' },
  { def: paced('K-C4-Cena', { scene: K_C4, seconds: c4End(K_C4_D, K_C4_H), holds: K_C4_HOLDS, stills: [], ...noSubs }), band: true, tone: (ms) => (ms < 8450 ? 'dark' : 'light'), toWhite: 8200 },
  // okno od nadpisu kroku (spodok ~200 px) po titulky: veko krabice pri priblizeni kamery vyjde nad ramec 16:9
  { def: paced('K-C5-Teren', { scene: C5_BAND, seconds: 8.4, stills: [], ...noSubs }), band: true, tone: () => 'light', steps: C5_STEPS('K-C5-Teren'), phase: PHASE_ARCHIV, shift: c5Shift, win: { top: 206, bottom: 1040, feather: 18 }, overflow: true },
  { def: paced('K-F1-Sken', { scene: LI_F1, seconds: K_F1_SECONDS, vo: false, stills: [] }), tone: () => 'light', steps: F1_STEPS, phase: PHASE_ARCHIV },
  { def: paced('K-F24-Aplikacia', { scene: LI_F24, seconds: K_F24_SECONDS, stills: [], ...noSubs }), tone: () => 'light', steps: K_F24_STEPS, phase: phases.app },
  { def: paced('K-F3-Vyhladavanie', { scene: LI_F3, seconds: K_F3_SECONDS, stills: [], ...noSubs }), tone: () => 'light', steps: f3Steps(F3_CLIP), phase: phases.search },
  { def: paced('K-C8-Ponuka', { scene: LI_C8, seconds: 10.2, stills: [], ...noSubs }), tone: () => 'light' },
  { def: paced('K-C9-Outro', { scene: LI_C9, seconds: 6.5, stills: [], ...noSubs }), tone: () => 'dark', chrome: false },
];

/** Jeden klip v ramci 4:5: pozadie na celu plochu, obsah (pas 16:9 alebo nativne), znacka, krok, titulky, web. */
const LiFrame: React.FC<{ d: LiDef }> = ({ d }) => {
  const frame = useCurrentFrame();
  const ms = (frame / FPS) * 1000;
  const tone = d.tone(ms);
  const [id, s] = d.def;
  const Body = s.component;
  const white = d.toWhite !== undefined ? tween(frame, d.toWhite, 600) : tone === 'light' ? 1 : 0;
  const win = d.win ?? BAND_WIN;
  const sh = d.shift ? d.shift(ms) : { x: 0, y: 0 };
  const wh = win.bottom - win.top;
  const mask = `linear-gradient(to bottom, transparent 0px, #000 ${win.feather}px, #000 ${wh - win.feather}px, transparent ${wh}px)`;
  return (
    <AbsoluteFill style={{ background: NAVY[900] }}>
      {white > 0 ? <AbsoluteFill style={{ background: '#fff', opacity: white }} /> : null}
      {d.band ? (
        <div style={{ position: 'absolute', left: 0, top: win.top, width: LI.w, height: win.bottom - win.top, overflow: 'hidden', WebkitMaskImage: mask, maskImage: mask }}>
          <div style={{ position: 'absolute', left: 0, top: BAND.y - win.top, width: 1920, height: 1080, transform: `translate(${sh.x}px, ${sh.y}px) scale(${S169})`, transformOrigin: '0 0' }}>
            <SceneFrameContext.Provider value={{ flatBg: true, hideFooter: true, overflowVisible: d.overflow }}>
              <Body />
            </SceneFrameContext.Provider>
          </div>
        </div>
      ) : (
        <Body />
      )}
      {d.chrome !== false ? <BrandRow tone={tone} /> : null}
      {d.steps ? <StepLabel steps={d.steps} phase={d.phase} frame={frame} /> : null}
      <BigSubtitles clip={id} tone={tone} />
      {d.chrome !== false ? <Web tone={tone} /> : null}
    </AbsoluteFill>
  );
};

export const liFrames = () => LI_LIST.reduce((a, d) => a + Math.round(d.def[1].seconds * FPS), 0);

export const K_LinkedIn: React.FC = () => {
  React.useEffect(() => {
    loadFonts();
  }, []);
  return (
    <Series>
      {LI_LIST.map((d) => (
        <Series.Sequence key={d.def[0]} durationInFrames={Math.round(d.def[1].seconds * FPS)}>
          <LiFrame d={d} />
        </Series.Sequence>
      ))}
    </Series>
  );
};
