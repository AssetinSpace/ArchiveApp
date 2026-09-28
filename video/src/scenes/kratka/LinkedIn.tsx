import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Series, staticFile, useCurrentFrame } from 'remotion';
import { LogoMark, SceneFrameContext } from '../../components/Scene';
import { voLines } from '../../components/Subtitles';
import { FOOTAGE_PHONE, PHONE_BEZEL, PhoneFrame, Rect } from '../../components/Device';
import { BrandMod, BrandSep, BrandStack, LOCKUP, LOCKUP_W } from '../../components/Brand';
import { C2_Hladanie } from '../C2_Hladanie';
import { C5_Teren } from '../C5_Teren';
import { DesktopFootageClip } from '../F2_Metadata';
import { C5_STEPS, SLOGAN, K_C4, K_C4_D, K_C4_H, K_F1_SECONDS, K_F1_TAPS, K_F24_MARKS, K_F24_SECONDS, K_F24_STEPS, K_F24_TAPS, K_F3_SECONDS, PHASE_ARCHIV, SOFTWARE_DESC, c4End, f3Marks, f3Steps } from './Kratka';
import { K_C4_HOLDS, paced } from '../../kratkaList';
import type { SceneDef } from '../../scenesList';
import { easeInOut, settle, tween } from '../../lib/anim';
import { loadFonts } from '../../lib/fonts';
import { offer, phases, sk } from '../../copy/sk';
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
 * Kolo 3: ponuka s bezpecnostou a vyzvou, zaver len logo a slogan. Kolo 4: uvod znova ako v kole 2, rad polica /
 * krabica / sanon / zlozka s QR v C5, ostre detaily (fotka z mobilu, prekreslene polia aplikacie), cesta k dokumentu
 * v F3, ponuka s dvoma volbami (kto to spracuje, kde to bezi), logo domcek | assetin | Archives bez .space.
 * Hlas a titulky: src/copy/vo_kratka.json, hudba mix-music.mjs --video.
 */
export const LI = { w: 1080, h: 1350 };
const S169 = LI.w / 1920; // mierka sceny 16:9 v pase
const BAND = { y: 271, h: 608 };
/** Okno aplikacie: obsah 1032 x 516 = pomer orezaneho zaznamu 1764 x 882 (2:1), lista 44 px. */
const WIN: Rect = { x: 24, y: 222, w: 1032, h: 516 + 44 };
const CALL_Y = 804; // zvacseny detail pod oknom (do ~1060)
const SUB_Y = 1080; // velke titulky

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
  subs?: boolean; // false = bez titulkov (C9: hlas povie len nazov, ktory je v obraze)
  overlay?: React.FC; // nativna vrstva na vysku nad obsahom (C4: logo, C5: polica / krabica / sanon / zlozka)
  labelOut?: boolean; // nazov kroku na konci klipu vybledne s obrazom (F3 -> C8, kde uz ziadny krok nie je)
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
 * Detail pod oknom aplikacie (kolo 4, Samuel: vystrizky zo zaznamu boli rozmazane): stitok nad, zeleny ramik. Obsah je
 * ostry: fotka titulnej strany je vyrez zo zaznamu mobilu (1206 x 2622, ten isty dokument ako v aplikacii), polia
 * aplikacie (navrh hodnoty, hladane slovo) su prekreslene jej pismom podla zaznamu, cesta k dokumentu je nakreslena.
 */
const Panel: React.FC<{ from: number; to: number; label: string; width: number; children: React.ReactNode }> = ({ from, to, label, width, children }) => {
  const frame = useCurrentFrame();
  const a = settle(frame, from * 1000) * (1 - tween(frame, to * 1000 - 250, 250));
  if (a <= 0.001) return null;
  return (
    <div style={{ position: 'absolute', left: (LI.w - width) / 2, top: CALL_Y, width, opacity: a, transform: `translateY(${(1 - a) * 14}px)` }}>
      <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 22, letterSpacing: '0.14em', textTransform: 'uppercase', color: BRAND[600], marginBottom: 10 }}>{label}</div>
      {children}
    </div>
  );
};
const BOX: React.CSSProperties = { position: 'relative', boxSizing: 'border-box', borderRadius: 14, overflow: 'hidden', border: `3px solid ${BRAND[400]}`, boxShadow: '0 14px 36px rgba(15,23,42,0.14)', background: '#fff' };
const APP_FONT = FONT.body; // aplikacia Assetin Archives pouziva Inter

/** Titulna strana z fotky (vyrez 510 x 114 zo zaznamu mobilu v case spuste, rovnaky dokument ako v aplikacii). */
const PHOTO_TITLE = { src: 'footage/k-photo-title.png', w: 510, h: 114 };
const PhotoTitle: React.FC<{ width: number }> = ({ width }) => (
  <div style={{ ...BOX, width, height: (width * PHOTO_TITLE.h) / PHOTO_TITLE.w + 6 }}>
    <Img src={staticFile(PHOTO_TITLE.src)} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
  </div>
);

/** Pole "Hodnota" s navrhom aplikacie; pri potvrdeni (klik v zazname) zelena lista vlavo a "Potvrdené" ako v aplikacii. */
const ValueField: React.FC<{ approveAt: number }> = ({ approveAt }) => {
  const frame = useCurrentFrame();
  const ok = settle(frame, approveAt * 1000);
  return (
    <div style={{ ...BOX, width: 940, padding: '20px 30px 24px 40px' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 10, background: BRAND[500], opacity: ok }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: APP_FONT, fontWeight: 500, fontSize: 26, color: INK[500] }}>Hodnota</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', borderRadius: 20, background: BRAND[50], border: `2px solid ${BRAND[300]}`, fontFamily: APP_FONT, fontWeight: 700, fontSize: 22, color: BRAND[700], opacity: ok, transform: `scale(${0.85 + 0.15 * ok})` }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={BRAND[600]} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5 L10 17 L19 7" />
          </svg>
          Potvrdené
        </div>
      </div>
      <div style={{ marginTop: 6, fontFamily: APP_FONT, fontWeight: 700, fontSize: 40, lineHeight: 1.18, letterSpacing: '-0.01em', color: INK[900] }}>Novostavba bytového domu SLNEČNÁ 12, BRATISLAVA</div>
    </div>
  );
};

/** Pole vyhladavania ako v aplikacii (ikona ?, zeleny okraj), slovo "vodovod" sa pise v case ako v zazname. */
const SEARCH_WORD = 'vodovod';
const SearchField: React.FC<{ typeFrom: number; typeTo: number }> = ({ typeFrom, typeTo }) => {
  const frame = useCurrentFrame();
  const sec = frame / FPS;
  const n = sec < typeFrom ? 0 : Math.min(SEARCH_WORD.length, 1 + Math.floor(((sec - typeFrom) / (typeTo - typeFrom)) * SEARCH_WORD.length));
  const caret = (sec >= typeFrom - 0.3 && sec <= typeTo + 0.2) || Math.floor(sec * 2.2) % 2 === 0;
  return (
    <div style={{ ...BOX, width: 880, height: 112, display: 'flex', alignItems: 'stretch' }}>
      <div style={{ width: 100, flex: 'none', borderRight: `2px solid ${INK[200]}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={38} height={38} viewBox="0 0 24 24" fill="none" stroke={INK[700]} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx={12} cy={12} r={9.5} />
          <path d="M9.4 9.3 a2.7 2.7 0 1 1 3.6 2.6 c-0.7 0.3 -1 0.8 -1 1.5 v0.4" />
          <circle cx={12} cy={17} r={0.6} fill={INK[700]} />
        </svg>
      </div>
      <div style={{ flex: 1, margin: 14, border: `3px solid ${BRAND[500]}`, borderRadius: 8, display: 'flex', alignItems: 'center', padding: '0 22px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {n > 0 ? <span style={{ fontFamily: APP_FONT, fontWeight: 500, fontSize: 44, color: INK[900] }}>{SEARCH_WORD.slice(0, n)}</span> : null}
        <span style={{ display: 'inline-block', flex: 'none', width: 3, height: 48, margin: n > 0 ? '0 0 0 3px' : '0 6px 0 0', background: INK[900], opacity: caret ? 1 : 0 }} />
        {n > 0 ? null : <span style={{ fontFamily: APP_FONT, fontSize: 30, color: INK[400] }}>Časti slov, "presné slová" alebo frázy</span>}
      </div>
    </div>
  );
};

/**
 * Ikony hierarchie archivu (obrys v kruhu ako karty ponuky): polica, krabica, sanon, zlozka, dokument. Kolo 4 (Samuel):
 * vysvetlit, ze QR dostane aj polica a sanon (C5), a ukazat cestu k dokumentu cez konkretnu policu a krabicu (F3).
 */
type HKind = 'shelf' | 'box' | 'binder' | 'folder' | 'doc';
const HIcon: React.FC<{ kind: HKind; size: number; on: boolean }> = ({ kind, size, on }) => (
  <div style={{ width: size, height: size, borderRadius: size / 2, flex: 'none', background: on ? BRAND[50] : '#fff', border: `3px solid ${on ? BRAND[400] : INK[200]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: on ? '0 10px 26px rgba(31,122,51,0.18)' : 'none' }}>
    <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 48 48" fill="none" stroke={on ? BRAND[600] : INK[400]} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      {kind === 'shelf' ? (
        <>
          <path d="M7 4 V44 M41 4 V44 M7 17 H41 M7 30 H41 M7 43 H41" />
          <rect x={11} y={8} width={11} height={9} rx={1} />
          <rect x={25} y={21} width={12} height={9} rx={1} />
          <rect x={12} y={34} width={10} height={9} rx={1} />
        </>
      ) : kind === 'box' ? (
        <>
          <rect x={6} y={10} width={36} height={9} rx={2} />
          <path d="M9 19 V38 a2 2 0 0 0 2 2 H37 a2 2 0 0 0 2 -2 V19" />
          <path d="M19 27 H29" />
        </>
      ) : kind === 'binder' ? (
        <>
          <rect x={13} y={4} width={22} height={40} rx={2.5} />
          <rect x={18} y={10} width={12} height={9} rx={1} />
          <circle cx={24} cy={33} r={3.5} />
        </>
      ) : kind === 'folder' ? (
        <path d="M5 13 a3 3 0 0 1 3 -3 H18 l4 5 H40 a3 3 0 0 1 3 3 V37 a3 3 0 0 1 -3 3 H8 a3 3 0 0 1 -3 -3 Z" />
      ) : (
        <>
          <path d="M12 4 H29 L37 12 V44 H12 Z" />
          <path d="M29 4 V12 H37" />
          <path d="M17 21 H32 M17 27 H32 M17 33 H27" />
        </>
      )}
    </svg>
  </div>
);
/** Nalepka QR (biela, cierne rohy ako na harku v C5) na ikone. */
const QrBadge: React.FC<{ size: number; t: number }> = ({ size, t }) => (
  <div style={{ position: 'absolute', right: -size * 0.28, top: -size * 0.22, width: size, height: size, borderRadius: size * 0.16, background: '#fff', border: `2px solid ${INK[300]}`, boxShadow: '0 6px 14px rgba(15,23,42,0.18)', opacity: Math.min(1, t * 1.4), transform: `scale(${0.4 + 0.6 * t}) rotate(${(1 - t) * -20}deg)` }}>
    <svg width={size - 4} height={size - 4} viewBox="0 0 36 36" style={{ display: 'block' }}>
      {[[4, 4], [20, 4], [4, 20]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y} width={12} height={12} fill={INK[900]} />
          <rect x={x + 3} y={y + 3} width={6} height={6} fill="#fff" />
          <rect x={x + 4.5} y={y + 4.5} width={3} height={3} fill={INK[900]} />
        </g>
      ))}
      {[[20, 20], [27, 24], [23, 29], [29, 30], [20, 28]].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width={4} height={4} fill={INK[900]} />
      ))}
    </svg>
  </div>
);

/**
 * C5 na vysku (kolo 4): pod krabicou rad Polica, Krabica, Sanon, Zlozka podla vety "Kazda polica, krabica, sanon aj
 * zlozka dostane QR kod": ikona pri svojom slove, nalepka QR pri slovach "dostane QR kod". Casy slov z nahravky.
 */
const C5_WORDS = [0.58, 1.24, 1.82, 2.42]; // s od zaciatku vety (K-C5-Teren-0.words.json)
const C5_ITEMS: { kind: HKind; label: string }[] = [
  { kind: 'shelf', label: 'Polica' },
  { kind: 'box', label: 'Krabica' },
  { kind: 'binder', label: 'Šanón' },
  { kind: 'folder', label: 'Zložka' },
];
const C5Hierarchy: React.FC = () => {
  const frame = useCurrentFrame();
  const line = voAt('K-C5-Teren', 0);
  const out = tween(frame, voAt('K-C5-Teren', 0, 1) + 500, 350);
  if (out >= 1) return null;
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: 868, display: 'flex', justifyContent: 'space-between', opacity: 1 - out }}>
      {C5_ITEMS.map((it, i) => {
        const t = settle(frame, line + C5_WORDS[i] * 1000 - 120);
        const qr = settle(frame, line + 2860 + i * 90); // "dostane QR kod"
        return (
          <div key={it.label} style={{ width: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: t, transform: `translateY(${(1 - t) * 18}px)` }}>
            <div style={{ position: 'relative' }}>
              <HIcon kind={it.kind} size={112} on={qr > 0.5} />
              {qr > 0 ? <QrBadge size={46} t={qr} /> : null}
            </div>
            <div style={{ marginTop: 12, fontFamily: FONT.display, fontWeight: 700, fontSize: 32, color: INK[900] }}>{it.label}</div>
          </div>
        );
      })}
    </div>
  );
};

/** C5 v 16:9 ma krabicu vlavo (vpravo bol panel krokov): na vysku sa pas na zaciatku plynulo posunie, krabica je na strede. */
const C5_SHIFT = 186;
/** Pas C5 o kusok nizsie: veko krabice pri priblizeni kamery ostane cele pod nadpisom kroku (okno od 206 px). */
const C5_DY = 60;
const c5Ease = (ms: number) => easeInOut(Math.min(1, Math.max(0, ms / 700)));
const c5Shift = (ms: number) => ({ x: C5_SHIFT * c5Ease(ms), y: C5_DY * c5Ease(ms) });

/**
 * F1 na vysku: mobil z pozicie na konci C5 (v pase) narastie na velky mobil na stred, potom skutocny fotoaparat.
 * Kolo 4 (Samuel: po odfoteni sa obraz rozbije a posunie dole): zaznam konci pred nahladom fotky, pri spusti blesk.
 */
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
  const shot = K_F1_TAPS[0].t * 1000;
  const flash = tween(frame, shot, 60) * (1 - tween(frame, shot + 60, 260));
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
          <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: Math.max(1 - screenIn, 0.85 * flash) }} />
        </div>
      </PhoneFrame>
      <AbsoluteFill style={{ background: '#fff', opacity: fadeOut }} />
    </AbsoluteFill>
  );
};

/**
 * F24 na vysku: cely zaznam v okne na celu sirku (bez priblizenia) a pod nim detail: text na fotke, potom navrh
 * aplikacie (Nazov projektu) az po potvrdenie, pri vete o fotke znova text na fotke.
 */
const kv = (i: number, k = 0) => voAt('K-F24-Aplikacia', i, k) / 1000;
const F24_SRC = 'footage/k-f24-review.mp4';
const LI_F24: React.FC = () => (
  <AbsoluteFill>
    {/* kolo 3: okno na konci nevybledne do bielej (dlzka +1 s len pre prelinacku), F3 nadvazuje v tom istom okne */}
    <DesktopFootageClip src={F24_SRC} seconds={K_F24_SECONDS + 1} steps={[]} taps={K_F24_TAPS} marks={K_F24_MARKS} win={WIN} enter />
    <Panel from={0.5} to={kv(0, 1) + 0.1} label="Na fotke" width={640}>
      <PhotoTitle width={640} />
    </Panel>
    {/* navrh ostava az po potvrdenie (klik 10,3 s na slove "potvrdi"), potom fotka pri vete "Fotka je dokaz" */}
    <Panel from={kv(0, 1) + 0.35} to={K_F24_TAPS[0].t + 0.95} label="Návrh aplikácie: názov projektu" width={940}>
      <ValueField approveAt={K_F24_TAPS[0].t} />
    </Panel>
    <Panel from={K_F24_TAPS[0].t + 0.95} to={K_F24_SECONDS + 1} label="Fotka pri zázname" width={640}>
      <PhotoTitle width={640} />
    </Panel>
  </AbsoluteFill>
);

/**
 * F3 na vysku: cely zaznam v okne, pod nim hladane slovo (pise sa v case ako v zazname), potom cesta k dokumentu:
 * Polica PL_01 -> Krabica KR_01 -> Zlozka ZL_03 -> Dokument, kroky sa rozsvietia pri slovach "polici", "krabici", "dokument".
 */
const F3_CLIP = 'K-F3-Vyhladavanie';
const F3_SRC = 'footage/k-f3-search.mp4';
const F3_WORDS = { polici: 3.82, krabici: 4.9, dokument: 5.18, lezi: 5.44 }; // s od zaciatku vety (words.json)
const PATH_STEPS: { kind: HKind; label: string; code: string; at: number }[] = [
  { kind: 'shelf', label: 'Polica', code: 'PL_01', at: F3_WORDS.polici - 0.15 },
  { kind: 'box', label: 'Krabica', code: 'KR_01', at: F3_WORDS.krabici - 0.15 },
  { kind: 'folder', label: 'Zložka', code: 'ZL_03', at: F3_WORDS.dokument },
  { kind: 'doc', label: 'Dokument', code: '', at: F3_WORDS.lezi },
];
const DocPath: React.FC<{ lineAt: number }> = ({ lineAt }) => {
  const frame = useCurrentFrame();
  const sec = frame / FPS;
  const W = 1000,
    C = 112,
    col = W / PATH_STEPS.length;
  return (
    <div style={{ position: 'relative', width: W, height: C + 108 }}>
      {PATH_STEPS.slice(1).map((st, i) => {
        const t = tween(frame, (lineAt + st.at) * 1000 - 250, 250);
        const x0 = col * i + col / 2 + C / 2 + 10,
          x1 = col * (i + 1) + col / 2 - C / 2 - 10;
        return (
          <div key={st.label} style={{ position: 'absolute', left: x0, top: C / 2 - 2, width: x1 - x0, height: 4, borderRadius: 2, background: INK[200] }}>
            <div style={{ width: `${t * 100}%`, height: '100%', borderRadius: 2, background: BRAND[500] }} />
            <svg width={18} height={22} viewBox="0 0 18 22" style={{ position: 'absolute', right: -6, top: -9 }}>
              <path d="M3 3 L13 11 L3 19" fill="none" stroke={t > 0.95 ? BRAND[500] : INK[300]} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        );
      })}
      {PATH_STEPS.map((st, i) => {
        const on = sec >= lineAt + st.at;
        const lit = settle(frame, (lineAt + st.at) * 1000);
        return (
          <div key={st.label} style={{ position: 'absolute', left: col * i, top: 0, width: col, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ transform: `scale(${1 + 0.08 * lit * (1 - tween(frame, (lineAt + st.at) * 1000 + 250, 300))})` }}>
              <HIcon kind={st.kind} size={C} on={on} />
            </div>
            <div style={{ marginTop: 12, height: 40, fontFamily: APP_FONT, fontWeight: 700, fontSize: 34, color: on ? BRAND[700] : INK[500] }}>{st.code || ' '}</div>
            <div style={{ marginTop: 2, fontFamily: FONT.display, fontWeight: 600, fontSize: 26, color: on ? INK[900] : INK[400] }}>{st.label}</div>
          </div>
        );
      })}
    </div>
  );
};
const LI_F3: React.FC = () => {
  const v = (k: number) => voAt(F3_CLIP, 0, k) / 1000;
  return (
    <AbsoluteFill>
      {/* kolo 3: bez `enter` (okno je na rovnakom mieste ako v F24, test: 0:45 biela diera pred vyhladavanim) */}
      <DesktopFootageClip src={F3_SRC} seconds={K_F3_SECONDS} steps={[]} phase={phases.search} marks={f3Marks(F3_CLIP)} win={WIN} />
      <Panel from={0.25} to={v(1) + 0.4} label="Hľadané slovo" width={880}>
        <SearchField typeFrom={0.8} typeTo={1.9} />
      </Panel>
      <Panel from={v(1) + 0.55} to={K_F3_SECONDS - 0.4} label="Cesta k dokumentu" width={1000}>
        <DocPath lineAt={v(0)} />
      </Panel>
    </AbsoluteFill>
  );
};

/** Ikony ponuky (obrys v kruhu): krabica, aplikacia, server (u vas), oblak (u nas), stit. */
type OfferIconKind = 'box' | 'app' | 'server' | 'cloud' | 'shield';
const OfferIcon: React.FC<{ kind: OfferIconKind; on: boolean; size?: number }> = ({ kind, on, size = 84 }) => (
  <div style={{ width: size, height: size, borderRadius: size / 2, background: on ? BRAND[50] : '#fff', border: `2px solid ${on ? BRAND[300] : INK[200]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
    <svg width={size * 0.54} height={size * 0.54} viewBox="0 0 48 48" fill="none" stroke={on ? BRAND[600] : INK[400]} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      {kind === 'box' ? (
        <>
          <rect x={6} y={10} width={36} height={9} rx={2} />
          <path d="M9 19 V38 a2 2 0 0 0 2 2 H37 a2 2 0 0 0 2 -2 V19" />
          <path d="M19 27 H29" />
        </>
      ) : kind === 'app' ? (
        <>
          <rect x={6} y={9} width={36} height={24} rx={3} />
          <path d="M3 39 H45" />
          <circle cx={22} cy={20} r={5} />
          <path d="M26 24 L30 28" />
        </>
      ) : kind === 'server' ? (
        <>
          <rect x={8} y={7} width={32} height={14} rx={3} />
          <rect x={8} y={27} width={32} height={14} rx={3} />
          <path d="M14 14 H15 M14 34 H15 M22 14 H33 M22 34 H33" />
        </>
      ) : kind === 'cloud' ? (
        <path d="M14 37 H35 a8 8 0 0 0 1 -15.9 A11 11 0 0 0 15 18.5 A9.3 9.3 0 0 0 14 37 Z" />
      ) : (
        <>
          <path d="M24 4 L40 10 V22 C40 32 33 40 24 44 C15 40 8 32 8 22 V10 Z" />
          <path d="M16.5 23.5 L22 29 L32 18" />
        </>
      )}
    </svg>
  </div>
);

/**
 * C8 na vysku (kolo 4, Samuel): dve volby a istota. Kto to spracuje: sluzba na kluc alebo vlastnymi silami v aplikacii.
 * Kde to bezi: na vasej infrastrukture alebo na nasej. Vzdy bezpecne a s respektom k vasim poziadavkam. Vyzva: vyskusajme
 * to na obmedzenom rozsahu, zadarmo a nezavazne. Karta, o ktorej sa prave hovori, ma zeleny okraj.
 */
const LI_C8: React.FC = () => {
  const frame = useCurrentFrame();
  const ms = (frame / FPS) * 1000;
  const L = (i: number, k = 0) => voAt('K-C8-Ponuka', i, k);
  const w2 = [1420, 2400]; // "vas", "nas" (ms od zaciatku vety "Aplikacia bezi u vas alebo u nas, vzdy bezpecne.", words.json)
  const groups = [
    {
      label: 'Kto to spracuje',
      from: 100,
      opts: [
        { icon: 'box' as OfferIconKind, title: offer.service.title, desc: 'Spracujeme za vás', from: 100, to: L(1) },
        { icon: 'app' as OfferIconKind, title: 'Vlastnými silami', desc: 'V našej aplikácii', from: L(1) - 150, to: L(2) },
      ],
    },
    {
      label: 'Kde to beží',
      from: L(2) - 150,
      opts: [
        { icon: 'server' as OfferIconKind, title: 'U vás', desc: 'Na vašej infraštruktúre', from: L(2) + w2[0] - 250, to: L(2) + w2[1] - 250 },
        { icon: 'cloud' as OfferIconKind, title: 'U nás', desc: 'Na našej infraštruktúre', from: L(2) + w2[1] - 250, to: L(2, 1) - 150 },
      ],
    },
  ];
  const W8 = 976,
    X8 = (LI.w - W8) / 2,
    GAP = 44,
    CW = (W8 - GAP) / 2,
    CH = 168;
  const tops = [236, 500];
  const safe = settle(frame, L(2, 1) - 150);
  const safeOn = ms >= L(2, 1) - 150 && ms < L(3) - 150;
  const cta = settle(frame, L(3) - 150);
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      <div style={{ position: 'absolute', left: X8, width: W8, top: 124, display: 'flex', alignItems: 'center', gap: 18, opacity: settle(frame, 0) }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 26, letterSpacing: '0.16em', textTransform: 'uppercase', color: BRAND[600], whiteSpace: 'nowrap' }}>{offer.kicker}</div>
        <div style={{ flex: 1, height: 2, background: INK[200] }} />
      </div>
      {groups.map((g, gi) => {
        const gt = settle(frame, g.from);
        return (
          <React.Fragment key={g.label}>
            <div style={{ position: 'absolute', left: X8, top: tops[gi] - 50, opacity: gt, fontFamily: FONT.display, fontWeight: 700, fontSize: 32, color: INK[500] }}>{g.label}</div>
            {g.opts.map((o, oi) => {
              const t = settle(frame, o.from);
              const on = ms >= o.from && ms < o.to;
              return (
                <div key={o.title} style={{ position: 'absolute', left: X8 + oi * (CW + GAP), top: tops[gi], width: CW, height: CH, boxSizing: 'border-box', borderRadius: 22, background: '#fff', border: `2px solid ${on ? BRAND[500] : INK[200]}`, boxShadow: on ? `0 0 0 2px ${BRAND[500]}, 0 16px 40px rgba(31,122,51,0.14)` : '0 10px 28px rgba(15,23,42,0.05)', opacity: t, transform: `translateY(${(1 - t) * 24}px)`, display: 'flex', alignItems: 'center', gap: 18, padding: '0 20px' }}>
                  <OfferIcon kind={o.icon} on={on} size={74} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 40, lineHeight: 1.05, letterSpacing: '-0.02em', color: on ? BRAND[700] : INK[900], whiteSpace: 'nowrap' }}>{o.title}</div>
                    <div style={{ marginTop: 8, fontFamily: FONT.body, fontSize: 27, lineHeight: 1.2, color: INK[500], whiteSpace: 'nowrap' }}>{o.desc}</div>
                  </div>
                </div>
              );
            })}
            {/* "alebo" medzi moznostami */}
            <div style={{ position: 'absolute', left: X8 + CW + GAP / 2 - 36, top: tops[gi] + CH / 2 - 21, width: 72, height: 42, borderRadius: 21, background: '#fff', border: `2px solid ${INK[200]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.body, fontWeight: 600, fontSize: 20, color: INK[500], opacity: settle(frame, g.opts[1].from) }}>alebo</div>
          </React.Fragment>
        );
      })}
      <div style={{ position: 'absolute', left: X8, top: 712, width: W8, height: 104, boxSizing: 'border-box', borderRadius: 22, background: safeOn ? BRAND[50] : '#fff', border: `2px solid ${safeOn ? BRAND[400] : INK[200]}`, opacity: safe, transform: `translateY(${(1 - safe) * 20}px)`, display: 'flex', alignItems: 'center', gap: 20, padding: '0 24px' }}>
        <OfferIcon kind="shield" on={safeOn} size={64} />
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 34, lineHeight: 1.15, color: safeOn ? BRAND[700] : INK[900] }}>Vždy bezpečne a s rešpektom k vašim požiadavkám</div>
      </div>
      <div style={{ position: 'absolute', left: X8, top: 848, width: W8, height: 196, boxSizing: 'border-box', borderRadius: 26, background: `linear-gradient(160deg, ${BRAND[700]} 0%, ${BRAND[600]} 100%)`, boxShadow: '0 18px 44px rgba(31,122,51,0.25)', opacity: cta, transform: `translateY(${(1 - cta) * 26}px) scale(${0.97 + 0.03 * cta})`, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px', color: '#fff' }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 36, color: BRAND[100] }}>Vyskúšajme to na obmedzenom rozsahu</div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 18, fontFamily: FONT.display, fontWeight: 800, fontSize: 60, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
          <svg width={50} height={50} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 12.5 L10 18 L19.5 6.5" />
          </svg>
          Zadarmo a nezáväzne
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Logo (kolo 4, Samuel): ako riadok znacky hore (domcek | assetin | Archives), bez .space, "Archives" rovnakym pismom
 * ako na zaverecnom zabere v kole 3 (Manrope 800). Rozostupy okolo ciar su rovnake (flex), ciary su na stred medzi textami.
 */
const Lockup: React.FC<{ size: number; onDark: boolean }> = ({ size: F, onDark }) => {
  const ink = onDark ? '#fff' : INK[900];
  const sep = <div style={{ width: Math.max(3, F * 0.045), height: F * 1.02, margin: `0 ${F * 0.3}px`, borderRadius: 2, background: onDark ? 'rgba(255,255,255,0.5)' : INK[300], flex: 'none' }} />;
  const word: React.CSSProperties = { fontFamily: FONT.display, fontWeight: 800, fontSize: F, lineHeight: 1, letterSpacing: '-0.02em', color: ink, whiteSpace: 'nowrap' };
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <LogoMark size={F * 0.9} color={onDark ? '#fff' : BRAND[700]} />
      {sep}
      <div style={word}>
        asset<span style={{ color: onDark ? BRAND[200] : BRAND[600] }}>in</span>
      </div>
      {sep}
      <div style={word}>Archives</div>
    </div>
  );
};

/**
 * C4: logo na vysku v bielej casti (miesto lockupu assetin.space z C4), casy ako v C4 (ms vystupu s pauzami 2 s).
 * Kolo 4 (test: sivy prelinacka z tmavej do bielej pred logom je sekana): biele svetlo sa rozlieha zo stredu
 * (od C4_REVEAL, 480 ms) ponad prelinacku pasu, ramec prepne farby, ked je cely biely (C4_LIGHT).
 */
/** Kolo 5: predel do bielej v C4 hned po hodinach (ms vystupu: scena 3400 + pauza 500); logo 800 ms po nom. */
const C4_WHITE = 3900;
const C4_REVEAL = C4_WHITE - 50;
const C4_LIGHT = C4_WHITE + 320;
const C4_BRAND_OUT = 9450; // odchod loga (C4 brandOut 7900 + d + h sceny + pauza 500) - 50 ms
/**
 * Kolo 5: bez vykresu a "2x EUR" ostava v C4 regal, otaznik a hodiny vlavo a prava polovica pasu je prazdna: pas sa
 * posunie o 140 px doprava (skupina na stred), pocas bielej sa vrati (krabica na konci C4 = zaciatok C5).
 */
const C4_DX = 140;
const c4Shift = (ms: number) => {
  const e = (a: number, d: number) => easeInOut(Math.min(1, Math.max(0, (ms - a) / d)));
  return { x: C4_DX * (e(300, 1400) - e(C4_WHITE + 100, 500)), y: 0 };
};
const C4Brand: React.FC = () => {
  const frame = useCurrentFrame();
  const r = easeInOut(Math.min(1, Math.max(0, ((frame / FPS) * 1000 - C4_REVEAL) / 480)));
  const out = tween(frame, C4_BRAND_OUT, 300);
  // kolo 5 (test: prazdna biela pred logom vyzera ako chyba): logo hned, ako svetlo zaplni obraz
  const logo = settle(frame, C4_WHITE + 380) * (1 - out);
  const tag = settle(frame, C4_WHITE + 700) * (1 - out);
  const R = 980 * r; // polomer svetla (roh ramca je 865 px od stredu)
  return (
    <>
      {r > 0 && r < 1 ? <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 46%, #fff ${Math.max(0, R - 140)}px, rgba(255,255,255,0) ${R}px)` }} /> : null}
      {r >= 1 && frame < ((C4_LIGHT + 400) / 1000) * FPS ? <AbsoluteFill style={{ background: '#fff' }} /> : null}
      {logo > 0.001 ? (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 450, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ opacity: logo, transform: `translateY(${(1 - logo) * 12}px) scale(${0.97 + 0.03 * logo})` }}>
        <Lockup size={88} onDark={false} />
      </div>
      <div style={{ marginTop: 40, fontFamily: FONT.body, fontWeight: 600, fontSize: 28, letterSpacing: '0.16em', textTransform: 'uppercase', color: BRAND[600], opacity: tag, transform: `translateY(${(1 - tag) * 10}px)` }}>{SLOGAN}</div>
    </div>
      ) : null}
    </>
  );
};

/** C9 (kolo 3, Samuel: posledny zaber bol prehusteny): len logo a slogan na zelenej. Kolo 4: logo bez .space. */
const LI_C9: React.FC = () => {
  const frame = useCurrentFrame();
  React.useEffect(() => {
    loadFonts();
  }, []);
  const logo = settle(frame, -250); // kolo 5 (test: prazdna zelena pred logom): logo je takmer hned na strihu
  const tag = settle(frame, 200);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${BRAND[800]} 0%, ${BRAND[600]} 100%)`, alignItems: 'center', justifyContent: 'center', fontFamily: FONT.body, color: '#fff' }}>
      <div style={{ marginTop: -40, opacity: logo, transform: `translateY(${(1 - logo) * 14}px) scale(${0.96 + 0.04 * logo})` }}>
        <Lockup size={94} onDark />
      </div>
      <div style={{ marginTop: 60, width: 900, textAlign: 'center', fontFamily: FONT.display, fontWeight: 600, fontSize: 44, lineHeight: 1.2, color: BRAND[100], opacity: tag, transform: `translateY(${(1 - tag) * 12}px)` }}>{SLOGAN}</div>
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
const C8_SECONDS = (voAt('K-C8-Ponuka', 3) + (voLines('K-C8-Ponuka')[3].dur ?? 4000)) / 1000 + 0.6;
const LI_LIST: LiDef[] = [
  // kolo 4: znova ako v kole 2 (kancelaria, prestrih do skladu, kamera na policu = zaciatok C4 "Hladanie trva hodiny")
  { def: paced('K-C2-Hladanie', { scene: C2_Hladanie, seconds: 10, stills: [], ...noSubs }), band: true, tone: () => 'dark' },
  { def: paced('K-C4-Cena', { scene: K_C4, seconds: c4End(K_C4_D, K_C4_H), holds: K_C4_HOLDS, stills: [], ...noSubs }), band: true, tone: (ms) => (ms < C4_LIGHT ? 'dark' : 'light'), toWhite: C4_WHITE, shift: c4Shift, overlay: C4Brand },
  // okno od nadpisu kroku (spodok ~200 px) po titulky: veko krabice pri priblizeni kamery vyjde nad ramec 16:9
  { def: paced('K-C5-Teren', { scene: C5_BAND, seconds: 8.4, stills: [], ...noSubs }), band: true, tone: () => 'light', steps: C5_STEPS('K-C5-Teren'), phase: PHASE_ARCHIV, shift: c5Shift, win: { top: 206, bottom: 1040, feather: 18 }, overflow: true, overlay: C5Hierarchy },
  { def: paced('K-F1-Sken', { scene: LI_F1, seconds: K_F1_SECONDS, vo: false, stills: [] }), tone: () => 'light', steps: F1_STEPS, phase: PHASE_ARCHIV },
  { def: paced('K-F24-Aplikacia', { scene: LI_F24, seconds: K_F24_SECONDS, stills: [], ...noSubs }), tone: () => 'light', steps: K_F24_STEPS, phase: phases.app },
  { def: paced('K-F3-Vyhladavanie', { scene: LI_F3, seconds: K_F3_SECONDS, stills: [], ...noSubs }), tone: () => 'light', steps: f3Steps(F3_CLIP), phase: phases.search, labelOut: true },
  { def: paced('K-C8-Ponuka', { scene: LI_C8, seconds: C8_SECONDS, stills: [], ...noSubs }), tone: () => 'light' },
  // zaver: hlas "Assetin Archives." = logo v obraze, preto bez titulkov
  { def: paced('K-C9-Outro', { scene: LI_C9, seconds: 3.6, stills: [], ...noSubs }), tone: () => 'dark', chrome: false, subs: false },
];

/** Jeden klip v ramci 4:5: pozadie na celu plochu, obsah (pas 16:9 alebo nativne), znacka, krok, titulky, web. */
const LiFrame: React.FC<{ d: LiDef }> = ({ d }) => {
  const frame = useCurrentFrame();
  const ms = (frame / FPS) * 1000;
  const tone = d.tone(ms);
  const [id, s] = d.def;
  const Body = s.component;
  const Overlay = d.overlay;
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
      {Overlay ? <Overlay /> : null}
      {d.chrome !== false ? <BrandRow tone={tone} /> : null}
      {d.steps ? (
        <div style={{ position: 'absolute', inset: 0, opacity: d.labelOut ? 1 - tween(frame, s.seconds * 1000 - 500, 400) : 1 }}>
          <StepLabel steps={d.steps} phase={d.phase} frame={frame} />
        </div>
      ) : null}
      {d.subs !== false ? <BigSubtitles clip={id} tone={tone} /> : null}
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
