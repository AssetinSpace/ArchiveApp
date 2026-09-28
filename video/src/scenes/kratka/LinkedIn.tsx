import React from 'react';
import { AbsoluteFill, Easing, Freeze, Img, OffthreadVideo, Series, staticFile, useCurrentFrame } from 'remotion';
import { LogoMark, SceneFrameContext } from '../../components/Scene';
import { voLines } from '../../components/Subtitles';
import { FOOTAGE_PHONE, PHONE_BEZEL, PhoneFrame, Rect } from '../../components/Device';
import { BrandMod, BrandSep, BrandStack, LOCKUP, LOCKUP_W } from '../../components/Brand';
import { C2_Hladanie } from '../C2_Hladanie';
import { C5_Teren } from '../C5_Teren';
import { DesktopFootageClip } from '../F2_Metadata';
import { C5_STEPS, SLOGAN, K_C4, K_C4_D, K_C4_H, K_C5_HOLDS, K_F1_SECONDS, K_F1_TAPS, K_F24_MARKS, K_F24_SECONDS, K_F24_STEPS, K_F24_TAPS, K_F3_SECONDS, PHASE_ARCHIV, SOFTWARE_DESC, c4End, f3Marks, f3Steps } from './Kratka';
import { paced } from '../../kratkaList';
import type { SceneDef } from '../../scenesList';
import { easeInOut, easeOut, pop, settle, tween } from '../../lib/anim';
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
 * Kolo 6: uvod priblizeny kamerou ramca (panacik, regal, otaznik a hodiny su na mobile vacsie), "Hladanie moze trvat
 * hodiny." hned po C2, prechod na logo zelenym a bielym pasom zdola a logo sa posklada (namiesto bieleho svetla).
 * Kolo 7: v C5 "kazda polozka ... podla toho, ako mate archiv usporiadany" s dvoma prikladmi usporiadania, v F3 udaje
 * o najdenej polozke a cesta k nej, ponuka na troch slidoch.
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
  toWhiteMs?: number; // kolo 6: dlzka prechodu pozadia (predvolene 600 ms; C4 ho prepne naraz pod bielou vrstvou)
  steps?: { from: number; title: string }[]; // ms, nazov kroku nad obrazom
  phase?: string;
  shift?: (ms: number) => { x: number; y: number; s?: number }; // posun pasu 16:9 (px ramca), s = priblizenie (kolo 6)
  win?: Win | ((ms: number) => Win); // okno pasu (predvolene BAND s makkymi okrajmi), kolo 6: moze sa menit v case
  overflow?: boolean; // obsah sceny smie presiahnut ramec 16:9 az po okraj okna (C5: veko krabice pri priblizeni)
  chrome?: boolean; // false = bez riadku znacky a webu (C9 ich ma vo vlastnom rozlozeni)
  subs?: boolean; // false = bez titulkov (C9: hlas povie len nazov, ktory je v obraze)
  overlay?: React.FC; // nativna vrstva na vysku nad obsahom (C4: logo, C5: polica / krabica / sanon / zlozka)
  top?: React.FC; // kolo 6: vrstva nad znackou a webom, pod titulkami (C4: prechod do bielej a nastup loga)
  subsOut?: [number, number]; // kolo 6: titulky v useku [od, do) ms vyblednu a nie su (C4: pocas prechodu na logo)
  rowOut?: [number, number]; // kolo 6: riadok znacky hore v useku [od, do) ms nie je, potom sa vrati (C4: pocas velkeho loga)
  labelOut?: boolean; // nazov kroku na konci klipu vybledne s obrazom (F3 -> C8, kde uz ziadny krok nie je)
};
/**
 * Okno, cez ktore vidno pas 16:9 (px ramca): hore/dole makky prechod `feather` px do pozadia ramca, aby obsah
 * prechadzajuci okrajom (prestrih v C2, priblizenie) nemal ostru rovnu hranu. Pozadie sceny = pozadie ramca, takze
 * samotny okraj nie je vidiet. Predvolene okno = pas; 26 px sa nedotkne obsahu v pokoji (C2 od 310 do 850 px).
 */
type Win = { top: number; bottom: number; feather: number };
const BAND_WIN: Win = { top: BAND.y, bottom: BAND.y + BAND.h, feather: 26 };

/**
 * Kolo 6 (Samuel: panacika v uvode je na mobile malo vidiet): kamera ramca nad pasom 16:9. Bod sceny (fx, fy) v px
 * 1920 x 1080 lezi pri priblizeni z v bode ramca (tx, ty); medzi klucmi (ms klipu) ease-in-out, mimo nich krajny kluc.
 */
type Cam = { z: number; fx: number; fy: number; tx: number; ty: number };
const CAM_ID: Cam = { z: 1, fx: 960, fy: 540, tx: LI.w / 2, ty: BAND.y + 540 * S169 }; // pas bez priblizenia
const camAt = (keys: [number, Cam][], ms: number): Cam => {
  if (ms <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [a, A] = keys[i - 1];
    const [b, B] = keys[i];
    if (ms < b) {
      const e = easeInOut((ms - a) / (b - a));
      const mix = (p: number, q: number) => p + (q - p) * e;
      return { z: mix(A.z, B.z), fx: mix(A.fx, B.fx), fy: mix(A.fy, B.fy), tx: mix(A.tx, B.tx), ty: mix(A.ty, B.ty) };
    }
  }
  return keys[keys.length - 1][1];
};
const camShift = (keys: [number, Cam][]) => (ms: number) => {
  const c = camAt(keys, ms);
  return { x: c.tx - S169 * c.z * c.fx, y: c.ty - BAND.y - S169 * c.z * c.fy, s: c.z };
};
/** Okno pasu v uvode (C2, C4): od riadku znacky po titulky, priblizeny obsah ma miesto nad aj pod pasom. */
const INTRO_WIN: Win = { top: 110, bottom: 1060, feather: 40 };

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
 * C5 na vysku (kolo 4): pod krabicou rad Polica, Krabica, Sanon, Zlozka podla vety "Kazda polozka, ci uz polica, krabica,
 * sanon alebo zlozka, dostane QR kod": ikona pri svojom slove, nalepka QR pri slovach "dostane QR kod". Casy slov z nahravky.
 * Kolo 7 (Samuel: nie je to pevne dane): pri "podla toho, ako mate archiv usporiadany" dva priklady usporiadania,
 * najprv polica, krabica, zlozka (bez sanonu), potom polica a sanon; ostatne polozky na chvilu stlmene, potom zas vsetky.
 */
const C5_WORDS = [1.3, 1.98, 2.6, 3.42]; // s od zaciatku vety (K-C5-Teren-0.words.json): polica, krabica, sanon, zlozka
const C5_QR = 3.92; // "dostane QR kod"
const C5_ARRANGE = { a: 4.94, b: 5.78, all: 6.88 }; // "podla toho", "archiv", koniec "usporiadany"
const C5_ITEMS: { kind: HKind; label: string; a: boolean; b: boolean }[] = [
  { kind: 'shelf', label: 'Polica', a: true, b: true },
  { kind: 'box', label: 'Krabica', a: true, b: false },
  { kind: 'binder', label: 'Šanón', a: false, b: true },
  { kind: 'folder', label: 'Zložka', a: true, b: false },
];
const C5Hierarchy: React.FC = () => {
  const frame = useCurrentFrame();
  const line = voAt('K-C5-Teren', 0);
  const out = tween(frame, voAt('K-C5-Teren', 0, 2) + 500, 350);
  if (out >= 1) return null;
  const at = (s: number) => line + s * 1000;
  const wa = tween(frame, at(C5_ARRANGE.a) - 80, 260) * (1 - tween(frame, at(C5_ARRANGE.b) - 80, 260)); // priklad A
  const wb = tween(frame, at(C5_ARRANGE.b) - 80, 260) * (1 - tween(frame, at(C5_ARRANGE.all), 320)); // priklad B
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: 868, display: 'flex', justifyContent: 'space-between', opacity: 1 - out }}>
      {C5_ITEMS.map((it, i) => {
        const t = settle(frame, at(C5_WORDS[i]) - 120);
        const qr = settle(frame, at(C5_QR) + i * 90); // "dostane QR kod"
        const off = wa * (it.a ? 0 : 1) + wb * (it.b ? 0 : 1); // stlmena polozka v priklade
        return (
          <div key={it.label} style={{ width: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: t * (1 - 0.72 * off), transform: `translateY(${(1 - t) * 18}px) scale(${1 - 0.08 * off})` }}>
            <div style={{ position: 'relative' }}>
              <HIcon kind={it.kind} size={112} on={qr > 0.5 && off < 0.5} />
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
 * F3 na vysku: cely zaznam v okne, pod nim hladane slovo (pise sa v case ako v zazname). Kolo 7 (Samuel: aplikacia ukaze
 * konkretne udaje o polozke a cestu ku konkretnej polozke): karta najdenej polozky podla zaznamu (ZL_03, Zlozka,
 * najdene v udajoch a v texte z fotky, priloha = fotka titulnej strany) pri "udaje o konkretnej polozke", potom cesta
 * Polica PL_01 -> Krabica KR_01 -> Zlozka ZL_03 (drobcek z aplikacie) pri "aj cestu k nej".
 */
const F3_CLIP = 'K-F3-Vyhladavanie';
const F3_SRC = 'footage/k-f3-search.mp4';
const F3_WORDS = { cestu: 4.76, k: 5.14, nej: 5.2 }; // s od zaciatku vety (words.json)
const PATH_STEPS: { kind: HKind; label: string; code: string; at: number }[] = [
  { kind: 'shelf', label: 'Polica', code: 'PL_01', at: F3_WORDS.cestu - 0.06 },
  { kind: 'box', label: 'Krabica', code: 'KR_01', at: F3_WORDS.k - 0.1 },
  { kind: 'folder', label: 'Zložka', code: 'ZL_03', at: F3_WORDS.nej + 0.06 },
];
const DocPath: React.FC<{ lineAt: number }> = ({ lineAt }) => {
  const frame = useCurrentFrame();
  const sec = frame / FPS;
  const W = 940,
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
            <div style={{ marginTop: 12, height: 40, fontFamily: APP_FONT, fontWeight: 700, fontSize: 34, color: on ? BRAND[700] : INK[500] }}>{st.code}</div>
            <div style={{ marginTop: 2, fontFamily: FONT.display, fontWeight: 600, fontSize: 26, color: on ? INK[900] : INK[400] }}>{st.label}</div>
          </div>
        );
      })}
    </div>
  );
};
/** Stitok ako v aplikacii: zeleny typ polozky, zlte "najdene v". */
const Chip: React.FC<{ tone: 'green' | 'amber'; children: React.ReactNode }> = ({ tone, children }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', height: 40, padding: '0 14px', borderRadius: 8, fontFamily: APP_FONT, fontWeight: 600, fontSize: 24, background: tone === 'green' ? BRAND[50] : '#FEF3C7', border: `2px solid ${tone === 'green' ? BRAND[300] : '#F2C94C'}`, color: tone === 'green' ? BRAND[700] : '#7A5200' }}>{children}</span>
);
/**
 * Najdena polozka (vysledok hladania "vodovod" v zazname): kod, typ, kde sa slovo naslo a priloha. Stitky aplikacie
 * "Metadata" a "OCR" su tu slovami pre laika (test kola 7: laik im nerozumel), v okne aplikacie ostavaju povodne.
 */
const ItemCard: React.FC = () => (
  <div style={{ ...BOX, width: 940, height: 176, padding: '0 28px', display: 'flex', alignItems: 'center', gap: 24 }}>
    <HIcon kind="folder" size={100} on />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontFamily: APP_FONT, fontWeight: 700, fontSize: 46, lineHeight: 1, color: INK[900] }}>ZL_03</span>
        <Chip tone="green">Zložka</Chip>
      </div>
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, fontFamily: APP_FONT, fontSize: 24, color: INK[500], whiteSpace: 'nowrap' }}>
        Nájdené v: <Chip tone="amber">Údaje</Chip> <Chip tone="amber">Text z fotky</Chip>
      </div>
    </div>
    <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontFamily: APP_FONT, fontWeight: 600, fontSize: 20, color: INK[500] }}>Príloha</div>
      <PhotoTitle width={300} />
    </div>
  </div>
);
const LI_F3: React.FC = () => {
  const v = (k: number) => voAt(F3_CLIP, 0, k) / 1000;
  return (
    <AbsoluteFill>
      {/* kolo 3: bez `enter` (okno je na rovnakom mieste ako v F24, test: 0:45 biela diera pred vyhladavanim) */}
      <DesktopFootageClip src={F3_SRC} seconds={K_F3_SECONDS} steps={[]} phase={phases.search} marks={f3Marks(F3_CLIP)} win={WIN} />
      <Panel from={0.25} to={v(1) + 0.4} label="Hľadané slovo" width={880}>
        <SearchField typeFrom={0.8} typeTo={1.9} />
      </Panel>
      <Panel from={v(1) + 0.55} to={v(2) + 0.05} label="Nájdená položka" width={940}>
        <ItemCard />
      </Panel>
      <Panel from={v(2) + 0.1} to={K_F3_SECONDS - 0.4} label="Cesta k položke" width={940}>
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
 * Kolo 7 (Samuel: na konci je to prehustene, rozdelit na viac slidov): tri slidy za sebou (posun dolava), nazov slidu je
 * nad obrazom ako kroky v ostatnych castiach (Ako zacat: Kto to spracuje / Kde to bezi / Prvy krok), vacsie karty.
 */
const C8_CLIP = 'K-C8-Ponuka';
const C8L = (i: number, k = 0) => voAt(C8_CLIP, i, k);
const C8_SLIDE = [C8L(2) - 350, C8L(3) - 350]; // prechod na 2. a 3. slide (tesne pred vetou)
const C8_STEPS = [
  { from: 0, title: 'Kto to spracuje' },
  { from: C8_SLIDE[0], title: 'Kde to beží' },
  { from: C8_SLIDE[1], title: 'Prvý krok' },
];
const C8W = 976,
  C8X = (LI.w - C8W) / 2;
/** Karta volby na slide: ikona, nazov, popis; zeleny okraj, ked sa o nej hovori. */
const OptionCard: React.FC<{ icon: OfferIconKind; title: string; desc: string; top: number; h: number; t: number; on: boolean }> = ({ icon, title, desc, top, h, t, on }) => (
  <div style={{ position: 'absolute', left: C8X, top, width: C8W, height: h, boxSizing: 'border-box', borderRadius: 26, background: '#fff', border: `2px solid ${on ? BRAND[500] : INK[200]}`, boxShadow: on ? `0 0 0 2px ${BRAND[500]}, 0 18px 44px rgba(31,122,51,0.14)` : '0 12px 30px rgba(15,23,42,0.06)', opacity: t, transform: `translateY(${(1 - t) * 24}px)`, display: 'flex', alignItems: 'center', gap: 30, padding: '0 40px' }}>
    <OfferIcon kind={icon} on={on} size={112} />
    <div style={{ minWidth: 0 }}>
      <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 58, lineHeight: 1.05, letterSpacing: '-0.02em', color: on ? BRAND[700] : INK[900], whiteSpace: 'nowrap' }}>{title}</div>
      <div style={{ marginTop: 10, fontFamily: FONT.body, fontSize: 34, lineHeight: 1.2, color: INK[500], whiteSpace: 'nowrap' }}>{desc}</div>
    </div>
  </div>
);
const OrPill: React.FC<{ top: number; t: number }> = ({ top, t }) => (
  <div style={{ position: 'absolute', left: (LI.w - 104) / 2, top, width: 104, height: 50, borderRadius: 25, background: '#fff', border: `2px solid ${INK[200]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.body, fontWeight: 600, fontSize: 26, color: INK[500], opacity: t }}>alebo</div>
);
const LI_C8: React.FC = () => {
  const frame = useCurrentFrame();
  const ms = (frame / FPS) * 1000;
  const w2 = [1420, 2400]; // "vas", "nas" (ms od zaciatku vety "Aplikacia bezi u vas alebo u nas, vzdy bezpecne.", words.json)
  const pos = tween(frame, C8_SLIDE[0], 520) + tween(frame, C8_SLIDE[1], 520); // 0, 1, 2 = slide
  const slide = (i: number, node: React.ReactNode) =>
    Math.abs(i - pos) < 1 ? (
      <div key={i} style={{ position: 'absolute', inset: 0, transform: `translateX(${(i - pos) * LI.w}px)` }}>
        {node}
      </div>
    ) : null;
  const vas = C8L(2) + w2[0] - 250,
    nas = C8L(2) + w2[1] - 250,
    safeAt = C8L(2, 1) - 150;
  const safe = settle(frame, safeAt);
  const safeOn = ms >= safeAt;
  const cta = settle(frame, C8_SLIDE[1] + 250);
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      {slide(
        0,
        <>
          <OptionCard icon="box" title={offer.service.title} desc="Spracujeme za vás" top={300} h={240} t={settle(frame, 100)} on={ms >= 100 && ms < C8L(1)} />
          <OrPill top={560} t={settle(frame, C8L(1) - 150)} />
          <OptionCard icon="app" title="Vlastnými silami" desc="V našej aplikácii" top={630} h={240} t={settle(frame, C8L(1) - 150)} on={ms >= C8L(1) - 150} />
        </>,
      )}
      {slide(
        1,
        <>
          <OptionCard icon="server" title="U vás" desc="Na vašej infraštruktúre" top={290} h={210} t={1} on={ms >= vas && ms < nas} />
          <OrPill top={516} t={1} />
          <OptionCard icon="cloud" title="U nás" desc="Na našej infraštruktúre" top={582} h={210} t={1} on={ms >= nas && ms < safeAt} />
          <div style={{ position: 'absolute', left: C8X, top: 838, width: C8W, height: 132, boxSizing: 'border-box', borderRadius: 26, background: safeOn ? BRAND[50] : '#fff', border: `2px solid ${safeOn ? BRAND[400] : INK[200]}`, opacity: safe, transform: `translateY(${(1 - safe) * 20}px)`, display: 'flex', alignItems: 'center', gap: 24, padding: '0 32px' }}>
            <OfferIcon kind="shield" on={safeOn} size={80} />
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 36, lineHeight: 1.15, color: safeOn ? BRAND[700] : INK[900] }}>Vždy bezpečne a s rešpektom k vašim požiadavkám</div>
          </div>
        </>,
      )}
      {slide(
        2,
        <div style={{ position: 'absolute', left: C8X, top: 400, width: C8W, height: 420, boxSizing: 'border-box', borderRadius: 32, background: `linear-gradient(160deg, ${BRAND[700]} 0%, ${BRAND[600]} 100%)`, boxShadow: '0 22px 50px rgba(31,122,51,0.25)', opacity: cta, transform: `scale(${0.97 + 0.03 * cta})`, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 56px', color: '#fff' }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 46, lineHeight: 1.2, color: BRAND[100] }}>Vyskúšajme to na obmedzenom rozsahu</div>
          <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', gap: 20, fontFamily: FONT.display, fontWeight: 800, fontSize: 68, lineHeight: 1.05, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
            <svg width={60} height={60} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
              <path d="M4.5 12.5 L10 18 L19.5 6.5" />
            </svg>
            Zadarmo a nezáväzne
          </div>
        </div>,
      )}
    </AbsoluteFill>
  );
};

/**
 * Logo (kolo 4, Samuel): ako riadok znacky hore (domcek | assetin | Archives), bez .space, "Archives" rovnakym pismom
 * ako na zaverecnom zabere v kole 3 (Manrope 800). Rozostupy okolo ciar su rovnake (flex), ciary su na stred medzi textami.
 * Kolo 6: `build` = ms klipu, od ktoreho sa logo posklada (ciary narastu, domcek dosadne, slova vyjdu zospodu z masky);
 * bez neho je logo hotove (C9).
 */
const OUT_EXPO = Easing.bezier(0.16, 1, 0.3, 1);
const Lockup: React.FC<{ size: number; onDark: boolean; build?: number }> = ({ size: F, onDark, build }) => {
  const frame = useCurrentFrame();
  const b = (a: number, d: number) => (build === undefined ? 1 : tween(frame, build + a, d, OUT_EXPO));
  const sepK = b(0, 480);
  const markK = build === undefined ? 1 : pop(frame, build + 60, { damping: 18 });
  const w1 = b(150, 650);
  const w2 = b(270, 650);
  const ink = onDark ? '#fff' : INK[900];
  const sep = <div style={{ width: Math.max(3, F * 0.045), height: F * 1.02, margin: `0 ${F * 0.3}px`, borderRadius: 2, background: onDark ? 'rgba(255,255,255,0.5)' : INK[300], flex: 'none', transform: `scaleY(${sepK})` }} />;
  const word: React.CSSProperties = { fontFamily: FONT.display, fontWeight: 800, fontSize: F, lineHeight: 1, letterSpacing: '-0.02em', color: ink, whiteSpace: 'nowrap' };
  // maska s rezervou pre dotiahy pisma: slovo vyjde zospodu, v pokoji sa nic neoreze
  const mask = (k: number, child: React.ReactNode) => (
    <div style={{ overflow: 'hidden', padding: `${F * 0.16}px 0.04em`, margin: `${-F * 0.16}px -0.04em` }}>
      <div style={{ transform: `translateY(${(1 - k) * 118}%)`, opacity: Math.min(1, k * 1.6) }}>{child}</div>
    </div>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ opacity: Math.min(1, markK * 1.6), transform: `scale(${0.45 + 0.55 * markK})` }}>
        <LogoMark size={F * 0.9} color={onDark ? '#fff' : BRAND[700]} />
      </div>
      {sep}
      {mask(
        w1,
        <div style={word}>
          asset<span style={{ color: onDark ? BRAND[200] : BRAND[600] }}>in</span>
        </div>,
      )}
      {sep}
      {mask(w2, <div style={word}>Archives</div>)}
    </div>
  );
};

/**
 * C4 v kole 6 (ms klipu). Samuel: "Hladanie moze trvat hodiny." a menej prazdneho miesta okolo 0:11 (predtym 2 s ticha
 * medzi C2 a vetou o hladani). Veta ide hned za C2 (od 0 ms, rec 270-1840 ms); scena C4 bezi rychlejsie na zaciatku:
 * kamera (0-1700 ms sceny) za 1100 ms, otaznik (1100) pri slove "Hladanie", hodiny (2600) pri slove "hodiny" (1450 ms),
 * dalej 1:1 o C4_SKIP neskor (Freeze na case sceny, scena C4 sa nemeni).
 */
const C4_MAP: [number, number][] = [
  [0, 0],
  [1100, 1700],
  [1450, 2600],
];
const C4_SKIP = C4_MAP[C4_MAP.length - 1][1] - C4_MAP[C4_MAP.length - 1][0]; // 1150 ms sceny naviac
const c4SceneMs = (ms: number) => {
  for (let i = 1; i < C4_MAP.length; i++) {
    const [a, sa] = C4_MAP[i - 1];
    const [b, sb] = C4_MAP[i];
    if (ms < b) return sa + ((Math.max(a, ms) - a) * (sb - sa)) / (b - a);
  }
  return ms + C4_SKIP;
};
const K_C4_FAST: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Freeze frame={(c4SceneMs((frame / FPS) * 1000) / 1000) * FPS}>
      <K_C4 />
    </Freeze>
  );
};
/**
 * Kolo 6 (Samuel: logo pri 0:14 nema "horiet" ako svetlo, ma prist profesionalnejsie): cisty prechod zdola nahor, najprv
 * zeleny pas znacky, WHITE_AFTER ms za nim biely (ostre hrany, WIPE_MS), potom sa logo posklada. Prechod je nad znackou a webom
 * ramca; pod bielou sa scena C4 prelinie do bielej (predel C4 = koniec zelenej) a ramec prepne farby (C4_LIGHT).
 */
const WIPE_MS = 480;
const WHITE_AFTER = 220; // test kola 6 (laik: z tmavej do bielej ako zablesk): chvilu cela zelena, biela az za nou
const WIPE_EASE = Easing.bezier(0.65, 0, 0.25, 1);
const C4_WIPE = 5600 + K_C4_D - C4_SKIP - WIPE_MS; // 2050 ms: 210 ms po slove "hodiny" (1840), plna kapela 0,15 s pred nim
const C4_LIGHT = C4_WIPE + WHITE_AFTER + WIPE_MS; // biela zakryje cely ramec: ramec prepne farby, pas bez priblizenia
const C4_PANEL_OUT = C4_WIPE + WIPE_MS + 630; // scena C4 je cela biela (prelinacka 600 ms), biela vrstva zmizne
const C4_LOGO = C4_WIPE + WHITE_AFTER + 280; // logo sa zacne skladat, ked biela prejde jeho miesto
const C4_BRAND_OUT = 7900 + K_C4_D + K_C4_H - C4_SKIP - 50; // odchod loga (C4 brandOut) - 50 ms
/** Pas v C4: z priblizenej police (koniec C2) na skupinu regal, otaznik, hodiny na stred; pod bielou bez priblizenia. */
const C2_END_CAM: Cam = { z: 1.3, fx: 960, fy: 540, tx: 540, ty: 575 };
const C4_GROUP_CAM: Cam = { z: 1.45, fx: 690, fy: 480, tx: 540, ty: 560 };
/**
 * Okno pasu C4: pocas priblizenia vacsie (INTRO_WIN), pod bielou znova pas s makkymi okrajmi. Scena C4 je tmava s bielou
 * prelinackou, jej okraj (878,5 px) by na bielom ramci ostal ako tenka siva ciara; okno pasu ho skryje ako v kole 5.
 */
const c4Win = (ms: number) => (ms < C4_LIGHT ? INTRO_WIN : BAND_WIN);
const c4Cam = camShift([
  [0, C2_END_CAM],
  [1100, C4_GROUP_CAM],
  [C4_LIGHT, C4_GROUP_CAM],
  [C4_LIGHT + 1, CAM_ID],
]);
/** C2: kancelaria priblizena na panacika a skrinu (pomaly najazd 1,45-1,75x), pri prestrihu do skladu spat na 1,3x. */
const OFFICE_CAM: Cam = { z: 1.45, fx: 1160, fy: 400, tx: 540, ty: 570 }; // test kola 6: panacik stale drobny
const c2Cam = camShift([
  [0, OFFICE_CAM],
  [3600, { ...OFFICE_CAM, z: 1.75 }],
  [3700, { ...OFFICE_CAM, z: 1.75 }],
  [4600, C2_END_CAM],
]);
const C4Top: React.FC = () => {
  const frame = useCurrentFrame();
  const ms = (frame / FPS) * 1000;
  const g = WIPE_EASE(Math.min(1, Math.max(0, (ms - C4_WIPE) / WIPE_MS)));
  const w = WIPE_EASE(Math.min(1, Math.max(0, (ms - C4_WIPE - WHITE_AFTER) / WIPE_MS)));
  const panel = 1 - tween(frame, C4_PANEL_OUT, 250);
  const out = tween(frame, C4_BRAND_OUT, 300);
  const tag = tween(frame, C4_LOGO + 650, 900, OUT_EXPO) * (1 - out);
  return (
    <>
      {g > 0 && w < 1 ? <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: LI.h * g, background: BRAND[600] }} /> : null}
      {w > 0 && panel > 0 ? <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: LI.h * w, background: '#fff', opacity: panel }} /> : null}
      {ms >= C4_LOGO && out < 1 ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 450, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 1 - out }}>
          <Lockup size={88} onDark={false} build={C4_LOGO} />
          <div style={{ marginTop: 40, fontFamily: FONT.body, fontWeight: 600, fontSize: 28, letterSpacing: `${0.16 + 0.22 * (1 - tag)}em`, textTransform: 'uppercase', color: BRAND[600], opacity: tag, whiteSpace: 'nowrap' }}>{SLOGAN}</div>
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
  // kolo 6: C2 o 0,3 s kratsie (koniec prehladavania krabic 9,6 s, rec 9,45 s), kamera ramca priblizi panacika
  { def: paced('K-C2-Hladanie', { scene: C2_Hladanie, seconds: 9.7, stills: [], ...noSubs }), band: true, tone: () => 'dark', shift: c2Cam, win: INTRO_WIN, overflow: true },
  { def: paced('K-C4-Cena', { scene: K_C4_FAST, seconds: c4End(K_C4_D, K_C4_H) - C4_SKIP / 1000, stills: [], ...noSubs }), band: true, tone: (ms) => (ms < C4_LIGHT ? 'dark' : 'light'), toWhite: C4_LIGHT, toWhiteMs: 60, shift: c4Cam, win: c4Win, top: C4Top, subsOut: [C4_WIPE - 120, voAt('K-C4-Cena', 1)], rowOut: [C4_WIPE + WIPE_MS, C4_BRAND_OUT + 300] },
  // okno od nadpisu kroku (spodok ~200 px) po titulky: veko krabice pri priblizeni kamery vyjde nad ramec 16:9
  { def: paced('K-C5-Teren', { scene: C5_BAND, seconds: 8.4, holds: K_C5_HOLDS, stills: [], ...noSubs }), band: true, tone: () => 'light', steps: C5_STEPS('K-C5-Teren'), phase: PHASE_ARCHIV, shift: c5Shift, win: { top: 206, bottom: 1040, feather: 18 }, overflow: true, overlay: C5Hierarchy },
  { def: paced('K-F1-Sken', { scene: LI_F1, seconds: K_F1_SECONDS, vo: false, stills: [] }), tone: () => 'light', steps: F1_STEPS, phase: PHASE_ARCHIV },
  { def: paced('K-F24-Aplikacia', { scene: LI_F24, seconds: K_F24_SECONDS, stills: [], ...noSubs }), tone: () => 'light', steps: K_F24_STEPS, phase: phases.app },
  { def: paced('K-F3-Vyhladavanie', { scene: LI_F3, seconds: K_F3_SECONDS, stills: [], ...noSubs }), tone: () => 'light', steps: f3Steps(F3_CLIP), phase: phases.search, labelOut: true },
  // kolo 7: tri slidy s nazvom nad obrazom; pri vyzve su jej slova v obraze, titulky by ich len opakovali
  { def: paced('K-C8-Ponuka', { scene: LI_C8, seconds: C8_SECONDS, stills: [], ...noSubs }), tone: () => 'light', steps: C8_STEPS, phase: offer.kicker, subsOut: [C8_SLIDE[1], 1e9] },
  // zaver: hlas "Assetin Archives." = logo v obraze, preto bez titulkov
  { def: paced('K-C9-Outro', { scene: LI_C9, seconds: 3.3, stills: [], ...noSubs }), tone: () => 'dark', chrome: false, subs: false },
];

/** Jeden klip v ramci 4:5: pozadie na celu plochu, obsah (pas 16:9 alebo nativne), znacka, krok, titulky, web. */
const LiFrame: React.FC<{ d: LiDef }> = ({ d }) => {
  const frame = useCurrentFrame();
  const ms = (frame / FPS) * 1000;
  const tone = d.tone(ms);
  const [id, s] = d.def;
  const Body = s.component;
  const Overlay = d.overlay;
  const Top = d.top;
  const white = d.toWhite !== undefined ? tween(frame, d.toWhite, d.toWhiteMs ?? 600) : tone === 'light' ? 1 : 0;
  const win = typeof d.win === 'function' ? d.win(ms) : d.win ?? BAND_WIN;
  const sh: { x: number; y: number; s?: number } = d.shift ? d.shift(ms) : { x: 0, y: 0 };
  const subsA = d.subsOut && ms >= d.subsOut[0] && ms < d.subsOut[1] ? 1 - tween(frame, d.subsOut[0], 150) : 1;
  const rowA = d.rowOut && ms >= d.rowOut[0] ? (ms < d.rowOut[1] ? 0 : tween(frame, d.rowOut[1], 300)) : 1;
  const wh = win.bottom - win.top;
  const mask = `linear-gradient(to bottom, transparent 0px, #000 ${win.feather}px, #000 ${wh - win.feather}px, transparent ${wh}px)`;
  return (
    <AbsoluteFill style={{ background: NAVY[900] }}>
      {white > 0 ? <AbsoluteFill style={{ background: '#fff', opacity: white }} /> : null}
      {d.band ? (
        <div style={{ position: 'absolute', left: 0, top: win.top, width: LI.w, height: win.bottom - win.top, overflow: 'hidden', WebkitMaskImage: mask, maskImage: mask }}>
          <div style={{ position: 'absolute', left: 0, top: BAND.y - win.top, width: 1920, height: 1080, transform: `translate(${sh.x}px, ${sh.y}px) scale(${S169 * (sh.s ?? 1)})`, transformOrigin: '0 0' }}>
            <SceneFrameContext.Provider value={{ flatBg: true, hideFooter: true, overflowVisible: d.overflow }}>
              <Body />
            </SceneFrameContext.Provider>
          </div>
        </div>
      ) : (
        <Body />
      )}
      {Overlay ? <Overlay /> : null}
      {d.chrome !== false && rowA > 0 ? (
        <div style={{ position: 'absolute', inset: 0, opacity: rowA }}>
          <BrandRow tone={tone} />
        </div>
      ) : null}
      {d.steps ? (
        <div style={{ position: 'absolute', inset: 0, opacity: d.labelOut ? 1 - tween(frame, s.seconds * 1000 - 500, 400) : 1 }}>
          <StepLabel steps={d.steps} phase={d.phase} frame={frame} />
        </div>
      ) : null}
      {d.chrome !== false ? <Web tone={tone} /> : null}
      {Top ? <Top /> : null}
      {d.subs !== false && subsA > 0 ? (
        <div style={{ position: 'absolute', inset: 0, opacity: subsA }}>
          <BigSubtitles clip={id} tone={tone} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const liFrames = () => LI_LIST.reduce((a, d) => a + Math.round(d.def[1].seconds * FPS), 0);
/** Kolo 6: zaciatky klipov vo filme (s), pre strihy hudby na takt (music_kratka.json). */
export const liStarts = () => {
  let f = 0;
  return LI_LIST.map((d) => {
    const from = f / FPS;
    f += Math.round(d.def[1].seconds * FPS);
    return [d.def[0], from] as const;
  });
};

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
