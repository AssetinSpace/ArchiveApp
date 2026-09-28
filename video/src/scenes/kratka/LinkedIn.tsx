import React from 'react';
import { AbsoluteFill, Easing, Freeze, Img, OffthreadVideo, Series, staticFile, useCurrentFrame } from 'remotion';
import { LogoMark, Scene, SceneFrameContext } from '../../components/Scene';
import { voLines } from '../../components/Subtitles';
import { FOOTAGE_PHONE, PHONE_BEZEL, PhoneFrame, Rect } from '../../components/Device';
import { BrandMod, BrandSep, BrandStack, LOCKUP, LOCKUP_W } from '../../components/Brand';
import { ArchiveBox } from '../../components/ArchiveBox';
import { Office, PATH as WH_PATH, Warehouse } from '../C2_Hladanie';
import { CAM_END, SV } from '../C3_Sklad';
import { iso } from '../../lib/iso';
import { C5_Teren } from '../C5_Teren';
import { DesktopFootageClip } from '../F2_Metadata';
import { C5_STEPS, SLOGAN, K_C4, K_C4_D, K_C4_H, K_C5_HOLDS, K_F1_SECONDS, K_F1_TAPS, K_F24_END, K_F24_MARKS, K_F24_SECONDS, K_F24_STEPS, K_F24_TAPS, K_F3_SECONDS, PHASE_ARCHIV, SOFTWARE_DESC, c4End, f3Marks, f3Steps } from './Kratka';
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
 * Kolo 8: v obraze len nadpis, obsah a titulky (znacka mala dole vpravo, web na konci), uvod bez "Vy viete...", sklad
 * a polica viac priblizene, pokojnejsia veta o QR, pod logom archiv -> katalog, vacsi mobil.
 * Kolo 9: panacik v sklade ide prirodzene (vlastny cas skladu 1:1), predel do loga o 0,1 s skor, F24 bez vety
 * "Fotka je dokaz...", pri "vodovod" karta so skutocnymi udajmi zlozky, ponuka zacina bezpecnostou a infrastrukturou
 * (online u nas / na vasej infrastrukture), vyzva "Zacnime jednou krabicou" s krabicou a nalepkou QR.
 * Kolo 10: sklad s rovnakou kamerou, mierkou a rychlostou chodze ako kancelaria (cisty prestrih dole, najazd na policu az
 * po vyblednuti skladu), tesnejsie rozlozenie (nadpis 48 px, obsah 36 px pod nim, vacsie detaily, titulky 1060 px),
 * "Nazov projektu", pauzy na citanie (karta zlozky, ponuka), kratsi mobil a zaver.
 * Kolo 11: uvod vyssie (podlaha bez rozmazania), dlhsia chodza, otaznik a hodiny naraz, cierny displej mobilu, v F24
 * "napriklad" a "pripadne opravi", karty na sirku okna a zelene potvrdenie, Bezpecne oddelene, znacka vpravo hore.
 * Hlas a titulky: src/copy/vo_kratka.json, hudba mix-music.mjs --video.
 */
export const LI = { w: 1080, h: 1350 };
const S169 = LI.w / 1920; // mierka sceny 16:9 v pase
const BAND = { y: 271, h: 608 };
/** Okno aplikacie: obsah 1032 x 516 = pomer orezaneho zaznamu 1764 x 882 (2:1), lista 44 px. */
const WIN: Rect = { x: 24, y: 138, w: 1032, h: 516 + 44 }; // kolo 10: 36 px pod nadpisom (predtym 222)
const CALL_Y = 716; // zvacseny detail pod oknom (od 736 px, kolo 10: vacsi, do ~980)
const SUB_Y = 1060; // velke titulky (kolo 10: o 20 px vyssie, dalej od listy prehravaca LinkedIn)
const TITLE_Y = 48; // nadpis kroku (kolo 8: 80 px; kolo 10, Samuel: nadpis aj obsah pod nim boli prilis odsadene)

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
const INTRO_WIN: Win = { top: 90, bottom: 1040, feather: 30 }; // kolo 11: podlaha konci nad prechodom (nie je rozmazana)

/**
 * Znacka. Kolo 8 (Samuel: znacku dat malu dole doprava): mala v pravom dolnom rohu. Kolo 11 (Samuel: v celom videu do
 * praveho horneho rohu domcek s textom assetin, male, decentne, ale jasne): vpravo hore na vysku nadpisu kroku.
 */
const BrandRow: React.FC<{ tone: Tone }> = ({ tone }) => (
  <div style={{ position: 'absolute', right: 44, top: TITLE_Y + 12, height: 34, display: 'flex', alignItems: 'center', gap: 10 }}>
    <LogoMark size={32} color={tone === 'dark' ? '#fff' : BRAND[700]} />
    <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 30, lineHeight: 1, letterSpacing: '-0.01em', color: tone === 'dark' ? '#fff' : INK[800] }}>
      asset<span style={{ color: tone === 'dark' ? BRAND[400] : BRAND[600] }}>in</span>
    </span>
  </div>
);

/**
 * Nazov kroku nad obrazom. Kolo 8 (Samuel: v obraze je prilis vela textu, staci nadpis, obsah a prepis hlasu): bez nazvu
 * fazy a bodiek postupu, len nadpis; je vyssie, lebo riadok znacky je dole vpravo.
 */
const StepLabel: React.FC<{ steps: { from: number; title: string }[]; frame: number }> = ({ steps, frame }) => {
  const ms = (frame / FPS) * 1000;
  const idx = Math.max(0, steps.findIndex((s, i) => ms >= s.from && (i === steps.length - 1 || ms < steps[i + 1].from)));
  return (
    <>
      {steps.map((s, i) => {
        const inT = settle(frame, s.from);
        return (
          <div key={i} style={{ position: 'absolute', left: 48, right: 48, top: TITLE_Y, opacity: (i === idx ? 1 : 0) * inT, transform: `translateY(${(1 - inT) * 12}px)`, fontFamily: FONT.display, fontWeight: 800, fontSize: 52, lineHeight: 1.04, letterSpacing: '-0.02em', color: INK[900] }}>
            {s.title}
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


/**
 * Detail pod oknom aplikacie (kolo 4, Samuel: vystrizky zo zaznamu boli rozmazane): stitok nad, zeleny ramik. Obsah je
 * ostry: fotka titulnej strany je vyrez zo zaznamu mobilu (1206 x 2622, ten isty dokument ako v aplikacii), polia
 * aplikacie (navrh hodnoty, hladane slovo) su prekreslene jej pismom podla zaznamu, cesta k dokumentu je nakreslena.
 */
const Panel: React.FC<{ from: number; to: number; label: string; width: number; children: React.ReactNode }> = ({ from, to, width, children }) => {
  const frame = useCurrentFrame();
  const a = settle(frame, from * 1000) * (1 - tween(frame, to * 1000 - 250, 250));
  if (a <= 0.001) return null;
  // kolo 8: stitok nad detailom vypadol (label ostava ako popis v kode), detail je v strede pasma medzi oknom a titulkami
  return (
    <div style={{ position: 'absolute', left: (LI.w - width) / 2, top: CALL_Y + 20, width, opacity: a, transform: `translateY(${(1 - a) * 14}px)` }}>
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

/**
 * Pole s navrhom aplikacie (kolo 10, Samuel: "Názov projektu" namiesto "Hodnota"). Kolo 10 (test: dlhy staticky usek):
 * pod nazvom pribudne autor a rok presne pri tychto slovach, hodnoty su zo zaznamu aplikacie (Generalny projektant
 * DOMINIS PROJEKT, s.r.o., Datum 2018-05-01); mena osob z titulnej strany tu nie su. Kolo 11 (Samuel: zarovnat s oknom
 * nad nim; po overeni a potvrdeni ma karta zozelenat aj na pozadi a dostat fajku): sirka a okraje ako okno aplikacie,
 * pri potvrdeni (klik v zazname pri "potvrdi") zelene pozadie, zeleny okraj a velka fajka vpravo.
 */
const ValueField: React.FC<{ approveAt: number; authorAt: number; yearAt: number }> = ({ approveAt, authorAt, yearAt }) => {
  const frame = useCurrentFrame();
  const ok = settle(frame, approveAt * 1000);
  const tick = pop(frame, approveAt * 1000 + 80);
  const au = settle(frame, authorAt * 1000);
  const yr = settle(frame, yearAt * 1000);
  const cell = (t: number, label: string, value: string) => (
    <div style={{ flex: 1, minWidth: 0, opacity: t, transform: `translateY(${(1 - t) * 10}px)` }}>
      <div style={{ fontFamily: APP_FONT, fontWeight: 500, fontSize: 25, color: INK[500] }}>{label}</div>
      <div style={{ marginTop: 2, fontFamily: APP_FONT, fontWeight: 700, fontSize: 34, lineHeight: 1.15, color: INK[900], whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  );
  const mix = (a: string, b: string) => (ok > 0.5 ? b : a);
  return (
    <div style={{ ...BOX, width: WIN.w, padding: '18px 34px 22px 40px', background: ok > 0 ? `rgba(234,245,235,${ok})` : '#fff', border: `3px solid ${mix(BRAND[400], BRAND[500])}`, boxShadow: ok > 0 ? `0 0 0 ${3 * ok}px ${BRAND[400]}, 0 14px 36px rgba(31,122,51,${0.18 * ok})` : BOX.boxShadow }}>
      {/* velka fajka vpravo pri potvrdeni */}
      <div style={{ position: 'absolute', right: 30, top: 22, width: 84, height: 84, borderRadius: 42, background: BRAND[500], display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: Math.min(1, tick * 1.4), transform: `scale(${0.4 + 0.6 * tick})`, boxShadow: '0 8px 20px rgba(31,122,51,0.3)' }}>
        <svg width={50} height={50} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5 L10 17 L19 7" />
        </svg>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontFamily: APP_FONT, fontWeight: 500, fontSize: 28, color: mix(INK[500], BRAND[700]) }}>Názov projektu</div>
        <div style={{ display: 'flex', alignItems: 'center', height: 40, padding: '0 16px', borderRadius: 20, background: BRAND[500], fontFamily: APP_FONT, fontWeight: 700, fontSize: 24, color: '#fff', opacity: ok, transform: `scale(${0.85 + 0.15 * ok})` }}>Potvrdené</div>
      </div>
      <div style={{ marginTop: 4, fontFamily: APP_FONT, fontWeight: 700, fontSize: 43, lineHeight: 1.14, letterSpacing: '-0.01em', color: INK[900] }}>
        Novostavba bytového domu
        <br />
        SLNEČNÁ 12, BRATISLAVA
      </div>
      {/* riadok s autorom a rokom sa vysunie pri slove "autora" (karta plynulo narastie) */}
      <div style={{ height: 96 * au, overflow: 'hidden' }}>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `2px solid ${ok > 0.5 ? BRAND[200] : INK[100]}`, display: 'flex', gap: 28 }}>
          {cell(au, 'Autor', 'DOMINIS PROJEKT, s.r.o.')}
          <div style={{ flex: 'none', width: 220 }}>{cell(yr, 'Rok', '2018')}</div>
        </div>
      </div>
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
    <div style={{ ...BOX, width: WIN.w, height: 136, display: 'flex', alignItems: 'stretch' }}>
      <div style={{ width: 118, flex: 'none', borderRight: `2px solid ${INK[200]}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={46} height={46} viewBox="0 0 24 24" fill="none" stroke={INK[700]} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx={12} cy={12} r={9.5} />
          <path d="M9.4 9.3 a2.7 2.7 0 1 1 3.6 2.6 c-0.7 0.3 -1 0.8 -1 1.5 v0.4" />
          <circle cx={12} cy={17} r={0.6} fill={INK[700]} />
        </svg>
      </div>
      <div style={{ flex: 1, margin: 16, border: `3px solid ${BRAND[500]}`, borderRadius: 10, display: 'flex', alignItems: 'center', padding: '0 26px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {n > 0 ? <span style={{ fontFamily: APP_FONT, fontWeight: 500, fontSize: 54, color: INK[900] }}>{SEARCH_WORD.slice(0, n)}</span> : null}
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
const C5_WORDS = [1.52, 2.3, 3.02, 3.88]; // s od zaciatku vety (K-C5-Teren-0.words.json): polica, krabica, sanon, zlozka
const C5_QR = 4.76; // "dostane QR kod"
const C5_ARRANGE = { a: 6.16, b: 7.18, all: 8.36 }; // "podla toho", "archiv", koniec "usporiadany"
const C5_ITEMS: { kind: HKind; label: string; a: boolean; b: boolean }[] = [
  { kind: 'shelf', label: 'Polica', a: true, b: true },
  { kind: 'box', label: 'Krabica', a: true, b: false },
  { kind: 'binder', label: 'Šanón', a: false, b: true },
  { kind: 'folder', label: 'Zložka', a: true, b: false },
];
const C5Hierarchy: React.FC = () => {
  const frame = useCurrentFrame();
  const line = voAt('K-C5-Teren', 0);
  const out = tween(frame, voAt('K-C5-Teren', 1) + 500, 350); // kolo 8: veta o foteni je samostatna (pauza pred nou)
  if (out >= 1) return null;
  const at = (s: number) => line + s * 1000;
  const wa = tween(frame, at(C5_ARRANGE.a) - 80, 260) * (1 - tween(frame, at(C5_ARRANGE.b) - 80, 260)); // priklad A
  const wb = tween(frame, at(C5_ARRANGE.b) - 80, 260) * (1 - tween(frame, at(C5_ARRANGE.all), 320)); // priklad B
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: 840, display: 'flex', justifyContent: 'space-between', opacity: 1 - out }}>
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
/** Pas C5 o kusok nizsie: veko krabice pri priblizeni kamery ostane cele pod nadpisom kroku (kolo 10: okno od 138 px). */
const C5_DY = 30; // kolo 10: nadpis je vyssie (48 px), krabica tiez
const c5Ease = (ms: number) => easeInOut(Math.min(1, Math.max(0, ms / 700)));
const c5Shift = (ms: number) => ({ x: C5_SHIFT * c5Ease(ms), y: C5_DY * c5Ease(ms) });

/**
 * F1 na vysku: mobil z pozicie na konci C5 (v pase) narastie na velky mobil na stred, potom skutocny fotoaparat.
 * Kolo 4 (Samuel: po odfoteni sa obraz rozbije a posunie dole): zaznam konci pred nahladom fotky, pri spusti blesk.
 */
const PHONE_FROM: Rect = { x: C5_SHIFT + FOOTAGE_PHONE.x * S169, y: BAND.y + C5_DY + FOOTAGE_PHONE.y * S169, w: FOOTAGE_PHONE.w * S169, h: FOOTAGE_PHONE.h * S169 };
/** Kolo 8 (Samuel: mobil je maly a zle orezany, titulky tu nie su): vacsi, na vysku od nadpisu po znacku dole. */
const PHONE_TO: Rect = { x: (LI.w - 575) / 2, y: 138, w: 575, h: 1040 }; // kolo 10: 36 px pod nadpisom
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
  // kolo 8 (test: biely preblik pri prechode z mobilu do aplikacie 0:31-0:33): kratke vyblednutie na konci, okno F24 hned
  const fadeOut = tween(frame, K_F1_SECONDS * 1000 - 250, 220);
  const shot = K_F1_TAPS[0].t * 1000;
  const flash = tween(frame, shot, 60) * (1 - tween(frame, shot + 60, 260));
  const videoW = at.w * (1 - 2 * PHONE_BEZEL);
  const videoH = (videoW * REC_PHONE.h) / REC_PHONE.w;
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      {/* kolo 11 (Samuel: v zaobleni rohov displeja su biele miesta): cierne pozadie displeja pod zaznamom */}
      <PhoneFrame at={at} screenBg="#000">
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' }}>
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
const F24_W0 = { autora: 6.32, rok: 7.24 }; // s od zaciatku vety K-F24-Aplikacia-0 (words.json; kolo 11: nova veta s "napriklad")
const LI_F24: React.FC = () => (
  <AbsoluteFill>
    {/* kolo 3: okno na konci nevybledne do bielej (dlzka +1 s len pre prelinacku), F3 nadvazuje v tom istom okne */}
    <DesktopFootageClip src={F24_SRC} seconds={K_F24_SECONDS + 1} steps={[]} taps={K_F24_TAPS} marks={K_F24_MARKS} win={WIN} />
    <Panel from={0.5} to={kv(0, 1) + 0.1} label="Na fotke" width={720}>
      <PhotoTitle width={720} />
    </Panel>
    {/* navrh ostava az po potvrdenie (klik na slove "potvrdi"); kolo 9: panel s fotkou pri zazname vypadol (duplicita) */}
    <Panel from={kv(0, 1) + 0.35} to={K_F24_END} label="Návrh aplikácie: názov projektu" width={WIN.w}>
      <ValueField approveAt={K_F24_TAPS[0].t} authorAt={kv(0) + F24_W0.autora - 0.1} yearAt={kv(0) + F24_W0.rok - 0.1} />
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
const F3_WORDS = { cestu: 0.18, k: 0.52, nej: 0.6 }; // s od zaciatku vety "aj cestu k nej." (kolo 10: samostatna veta, rez v 4,62 s povodnej medzi "polozke" a "aj")
const PATH_STEPS: { kind: HKind; label: string; code: string; at: number }[] = [
  { kind: 'shelf', label: 'Polica', code: 'PL_01', at: F3_WORDS.cestu - 0.06 },
  { kind: 'box', label: 'Krabica', code: 'KR_01', at: F3_WORDS.k - 0.1 },
  { kind: 'folder', label: 'Zložka', code: 'ZL_03', at: F3_WORDS.nej + 0.06 },
];
const DocPath: React.FC<{ lineAt: number }> = ({ lineAt }) => {
  const frame = useCurrentFrame();
  const sec = frame / FPS;
  const W = WIN.w,
    C = 124,
    col = W / PATH_STEPS.length;
  return (
    <div style={{ position: 'relative', width: W, height: C + 118 }}>
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
            <div style={{ marginTop: 14, height: 44, fontFamily: APP_FONT, fontWeight: 700, fontSize: 38, color: on ? BRAND[700] : INK[500] }}>{st.code}</div>
            <div style={{ marginTop: 2, fontFamily: FONT.display, fontWeight: 600, fontSize: 29, color: on ? INK[900] : INK[400] }}>{st.label}</div>
          </div>
        );
      })}
    </div>
  );
};
/** Stitok ako v aplikacii: zeleny typ polozky, zlte "najdene v". */
const Chip: React.FC<{ tone: 'green' | 'amber'; children: React.ReactNode }> = ({ tone, children }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', height: 44, padding: '0 16px', borderRadius: 9, fontFamily: APP_FONT, fontWeight: 600, fontSize: 27, background: tone === 'green' ? BRAND[50] : '#FEF3C7', border: `2px solid ${tone === 'green' ? BRAND[300] : '#F2C94C'}`, color: tone === 'green' ? BRAND[700] : '#7A5200' }}>{children}</span>
);
/**
 * Najdena polozka (vysledok hladania "vodovod" v zazname). Kolo 9 (Samuel: po slove "vodovod" cakam konkretne udaje,
 * napr. vodovodna pripojka): udaje zo zlozky ZL_03 presne podla titulnej strany na fotke (nazov projektu, stupen,
 * datum) a riadok, v ktorom sa slovo naslo ("Doplnenie vodovodnej pripojky podla poziadavky investora", zmena c. 1),
 * "vodovod" je zvyraznene ako v aplikacii. Mena osob z titulnej strany tu nie su.
 */
const HIT_TEXT = ['Doplnenie ', 'vodovod', 'nej prípojky podľa požiadavky investora'] as const;
const ItemCard: React.FC = () => (
  <div style={{ ...BOX, width: WIN.w, padding: '20px 34px 24px 40px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <HIcon kind="folder" size={64} on />
      <span style={{ fontFamily: APP_FONT, fontWeight: 700, fontSize: 40, lineHeight: 1, color: INK[900] }}>ZL_03</span>
      <Chip tone="green">Zložka</Chip>
      <span style={{ marginLeft: 'auto', fontFamily: APP_FONT, fontSize: 24, color: INK[500], whiteSpace: 'nowrap' }}>Projekt pre stavebné povolenie · 05/2018</span>
    </div>
    <div style={{ marginTop: 14, fontFamily: APP_FONT, fontWeight: 700, fontSize: 34, lineHeight: 1.15, color: INK[900], whiteSpace: 'nowrap' }}>Novostavba bytového domu SLNEČNÁ 12, BRATISLAVA</div>
    <div style={{ marginTop: 14, padding: '12px 18px', borderRadius: 10, background: '#FFFBEB', border: '2px solid #F2C94C', fontFamily: APP_FONT, fontSize: 29, lineHeight: 1.25, color: INK[700], whiteSpace: 'nowrap' }}>
      {HIT_TEXT[0]}
      <span style={{ background: '#FDE68A', borderRadius: 4, padding: '0 3px', fontWeight: 700, color: INK[900] }}>{HIT_TEXT[1]}</span>
      {HIT_TEXT[2]}
    </div>
  </div>
);
const LI_F3: React.FC = () => {
  const v = (k: number) => voAt(F3_CLIP, 0, k) / 1000;
  const path = voAt(F3_CLIP, 1) / 1000; // kolo 10: "aj cestu k nej." po pauze 1,2 s, karta polozky sa da docitat
  return (
    <AbsoluteFill>
      {/* kolo 3: bez `enter` (okno je na rovnakom mieste ako v F24, test: 0:45 biela diera pred vyhladavanim) */}
      <DesktopFootageClip src={F3_SRC} seconds={K_F3_SECONDS} steps={[]} phase={phases.search} marks={f3Marks(F3_CLIP)} win={WIN} />
      <Panel from={0.25} to={v(1) + 0.4} label="Hľadané slovo" width={WIN.w}>
        <SearchField typeFrom={0.8} typeTo={1.9} />
      </Panel>
      <Panel from={v(1) + 0.45} to={path + 0.05} label="Nájdená položka" width={WIN.w}>
        <ItemCard />
      </Panel>
      <Panel from={path + 0.1} to={K_F3_SECONDS - 0.4} label="Cesta k položke" width={WIN.w}>
        <DocPath lineAt={path} />
      </Panel>
    </AbsoluteFill>
  );
};

/** Ikony ponuky (obrys v kruhu): krabica, aplikacia, server (u vas), oblak (u nas), stit. */
type OfferIconKind = 'box' | 'app' | 'server' | 'cloud' | 'shield' | 'catalog';
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
      ) : kind === 'catalog' ? (
        <>
          <rect x={6} y={7} width={36} height={9} rx={2} />
          <rect x={6} y={20} width={36} height={9} rx={2} />
          <rect x={6} y={33} width={36} height={9} rx={2} />
          <path d="M11 11.5 H14 M11 24.5 H14 M11 37.5 H14" />
        </>
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
 * Kolo 9 (Samuel: zacat bezpecnostou, "online u nas alebo na vasej infrastrukture"; vyzva na obmedzeny rozsah je sucha,
 * posudit "jednu krabicu"): slide Kde to bezi zacina kartou Bezpecne, volby pridu pri slove "online". Vyzva je konkretna
 * ("Zacnime jednou krabicou, zadarmo a nezavazne."): krabica z C5, nalepka QR na nu dopadne pri "krabicou" a zelena
 * pilulka pri "zadarmo". Ako prvy krok (nie cela ponuka) neznie amatersky a divak si ju vie predstavit.
 */
const C8_CLIP = 'K-C8-Ponuka';
const C8L = (i: number, k = 0) => voAt(C8_CLIP, i, k);
const C8_SLIDE = [C8L(2) - 350, C8L(3) - 350]; // prechod na 2. a 3. slide (tesne pred vetou)
/** Casy slov (ms od zaciatku vety, public/vo-kratka/lines/K-C8-Ponuka-2/3.words.json). */
const C8_W2 = { bezpecne: 1240, online: 3160, na: 4700 };
const C8_W3 = { krabicou: 1120, zadarmo: 2040 };
const C8_STEPS = [
  { from: 0, title: 'Kto to spracuje' },
  { from: C8_SLIDE[0], title: 'Kde to beží' },
  { from: C8_SLIDE[1], title: 'Prvý krok' },
];
const C8W = 976,
  C8X = (LI.w - C8W) / 2;
/** Karta volby na slide: ikona, nazov, popis; zeleny okraj, ked sa o nej hovori. */
const OptionCard: React.FC<{ icon: OfferIconKind; title: string; desc: string; top: number; h: number; t: number; on: boolean; size?: number; inset?: number }> = ({ icon, title, desc, top, h, t, on, size = 58, inset = 0 }) => (
  <div style={{ position: 'absolute', left: C8X + inset, top, width: C8W - 2 * inset, height: h, boxSizing: 'border-box', borderRadius: 26, background: '#fff', border: `2px solid ${on ? BRAND[500] : INK[200]}`, boxShadow: on ? `0 0 0 2px ${BRAND[500]}, 0 18px 44px rgba(31,122,51,0.14)` : '0 12px 30px rgba(15,23,42,0.06)', opacity: t, transform: `translateY(${(1 - t) * 24}px)`, display: 'flex', alignItems: 'center', gap: 30, padding: '0 40px' }}>
    <OfferIcon kind={icon} on={on} size={118} />
    <div style={{ minWidth: 0 }}>
      <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: size, lineHeight: 1.05, letterSpacing: '-0.02em', color: on ? BRAND[700] : INK[900], whiteSpace: 'nowrap' }}>{title}</div>
      <div style={{ marginTop: 10, fontFamily: FONT.body, fontSize: 36, lineHeight: 1.2, color: INK[500], whiteSpace: 'nowrap' }}>{desc}</div>
    </div>
  </div>
);
/**
 * Kolo 11 (Samuel: "Bezpečne" ma byt oddelene od volieb online u nas / na vasej infrastrukture, teraz splyva): bezpecnost
 * je zeleny pas nad volbami (iny styl ako karty), volby su spolu v sivom ramci pod nim.
 */
const SafeBanner: React.FC<{ top: number; on: boolean }> = ({ top, on }) => (
  <div style={{ position: 'absolute', left: C8X, top, width: C8W, height: 150, boxSizing: 'border-box', borderRadius: 26, background: on ? BRAND[100] : BRAND[50], border: `2px solid ${on ? BRAND[500] : BRAND[200]}`, boxShadow: on ? `0 0 0 2px ${BRAND[500]}, 0 18px 44px rgba(31,122,51,0.16)` : 'none', display: 'flex', alignItems: 'center', gap: 28, padding: '0 40px' }}>
    <OfferIcon kind="shield" on size={100} />
    <div>
      <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 56, lineHeight: 1.05, letterSpacing: '-0.02em', color: BRAND[700] }}>Bezpečne</div>
      <div style={{ marginTop: 8, fontFamily: FONT.body, fontSize: 34, lineHeight: 1.2, color: INK[600] }}>Podľa vašich požiadaviek</div>
    </div>
  </div>
);
const OrPill: React.FC<{ top: number; t: number }> = ({ top, t }) => (
  <div style={{ position: 'absolute', left: (LI.w - 104) / 2, top, width: 104, height: 50, borderRadius: 25, background: '#fff', border: `2px solid ${INK[200]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.body, fontWeight: 600, fontSize: 26, color: INK[500], opacity: t }}>alebo</div>
);
const LI_C8: React.FC = () => {
  const frame = useCurrentFrame();
  const ms = (frame / FPS) * 1000;
  const pos = tween(frame, C8_SLIDE[0], 520) + tween(frame, C8_SLIDE[1], 520); // 0, 1, 2 = slide
  const slide = (i: number, node: React.ReactNode) =>
    Math.abs(i - pos) < 1 ? (
      <div key={i} style={{ position: 'absolute', inset: 0, transform: `translateX(${(i - pos) * LI.w}px)` }}>
        {node}
      </div>
    ) : null;
  const safeAt = C8L(2) + C8_W2.bezpecne - 250,
    onlineAt = C8L(2) + C8_W2.online - 250,
    yoursAt = C8L(2) + C8_W2.na - 250;
  const opts = settle(frame, onlineAt);
  const head = settle(frame, C8L(3) - 100);
  const sticker = pop(frame, C8L(3) + C8_W3.krabicou - 100);
  const free = pop(frame, C8L(3) + C8_W3.zadarmo - 150, { damping: 16 });
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      {slide(
        0,
        <>
          <OptionCard icon="box" title={offer.service.title} desc="Spracujeme za vás" top={220} h={260} t={settle(frame, 100)} on={ms >= 100 && ms < C8L(1)} />
          <OrPill top={500} t={settle(frame, C8L(1) - 150)} />
          <OptionCard icon="app" title="Vlastnými silami" desc="V našej aplikácii" top={570} h={260} t={settle(frame, C8L(1) - 150)} on={ms >= C8L(1) - 150} />
        </>,
      )}
      {slide(
        1,
        <>
          <SafeBanner top={190} on={ms >= safeAt && ms < onlineAt} />
          <div style={{ position: 'absolute', left: C8X, top: 380, width: C8W, height: 520, boxSizing: 'border-box', borderRadius: 30, background: INK[50], border: `1px solid ${INK[100]}`, opacity: opts }} />
          <OptionCard icon="cloud" title="Online u nás" desc="Bez vlastných serverov" top={400} h={190} t={opts} on={ms >= onlineAt && ms < yoursAt} inset={20} />
          <OrPill top={615} t={opts} />
          <OptionCard icon="server" title="Na vašej infraštruktúre" desc="Na vašich serveroch" top={690} h={190} t={opts} on={ms >= yoursAt} size={52} inset={20} />
        </>,
      )}
      {slide(
        2,
        <>
          <ArchiveBox state={{ lid: 0, binders: [0, 0, 0], qr: [0, 0, 0, sticker] }} size={700} style={{ position: 'absolute', left: (LI.w - 700) / 2, top: 156 }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 832, textAlign: 'center', fontFamily: FONT.display, fontWeight: 800, fontSize: 76, lineHeight: 1.05, letterSpacing: '-0.02em', color: INK[900], opacity: head, transform: `translateY(${(1 - head) * 24}px)` }}>
            Začnime <span style={{ color: BRAND[600] }}>jednou krabicou</span>
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 966, display: 'flex', justifyContent: 'center', opacity: Math.min(1, free * 1.5), transform: `scale(${0.85 + 0.15 * free})` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '22px 44px', borderRadius: 999, background: `linear-gradient(160deg, ${BRAND[700]} 0%, ${BRAND[600]} 100%)`, boxShadow: '0 18px 40px rgba(31,122,51,0.25)', fontFamily: FONT.display, fontWeight: 800, fontSize: 54, lineHeight: 1, letterSpacing: '-0.01em', color: '#fff', whiteSpace: 'nowrap' }}>
              <svg width={52} height={52} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
                <path d="M4.5 12.5 L10 18 L19.5 6.5" />
              </svg>
              Zadarmo a nezáväzne
            </div>
          </div>
        </>,
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
  [550, 1100], // kolo 11 (Samuel: otaznik a hodiny naraz, nech su vidiet dost dlho): kamera 2x
  [800, 1350], // otaznik vyskoci 1:1 pri "Hladanie"
  [900, 2600], // zvysok vyskoku a koniec kamery rychlo, hodiny hned za otaznikom (sceny 2600 ms)
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
const C4_WIPE = 5600 + K_C4_D - C4_SKIP - WIPE_MS; // 1950 ms (kolo 9): 110 ms po slove "hodiny" (1840), plna kapela tesne pred nim
const C4_LIGHT = C4_WIPE + WHITE_AFTER + WIPE_MS; // biela zakryje cely ramec: ramec prepne farby, pas bez priblizenia
const C4_PANEL_OUT = C4_WIPE + WIPE_MS + 630; // scena C4 je cela biela (prelinacka 600 ms), biela vrstva zmizne
const C4_LOGO = C4_WIPE + WHITE_AFTER + 280; // logo sa zacne skladat, ked biela prejde jeho miesto
const C4_BRAND_OUT = 7900 + K_C4_D + K_C4_H - C4_SKIP - 50; // odchod loga (C4 brandOut) - 50 ms
/**
 * Pas v C4: z priblizenej police (koniec C2) na skupinu regal, otaznik, hodiny na stred; pod bielou bez priblizenia.
 * Kolo 8 (Samuel: v sklade, ked tam hlada, to nie je dost priblizene): polica s prehladavanim krabic 1,8x (predtym 1,3x).
 */
const C2_END_CAM: Cam = { z: 1.8, fx: 960, fy: 450, tx: 540, ty: 600 };
const C4_GROUP_CAM: Cam = { z: 1.45, fx: 690, fy: 480, tx: 540, ty: 560 };
/**
 * Okno pasu C4: pocas priblizenia vacsie (INTRO_WIN), pod bielou znova pas s makkymi okrajmi. Scena C4 je tmava s bielou
 * prelinackou, jej okraj (878,5 px) by na bielom ramci ostal ako tenka siva ciara; okno pasu ho skryje ako v kole 5.
 */
const c4Win = (ms: number) => (ms < C4_LIGHT ? INTRO_WIN : BAND_WIN);
const c4Cam = camShift([
  [0, C2_END_CAM],
  [800, C4_GROUP_CAM],
  [C4_LIGHT, C4_GROUP_CAM],
  [C4_LIGHT + 1, CAM_ID],
]);
/**
 * Kolo 8 (Samuel: vynechat "Vy viete, ze tam niekde je.") a kolo 9 (Samuel: panacik v sklade ide extremne rychlo):
 * kancelaria a sklad maju vlastny cas (Office a Warehouse z C2_Hladanie, scena sa nemeni). Delenie vedla seba
 * (kancelaria a sklad naraz) som neskusal: na sirku 4:5 by boli obe polovice uzke a panacik mensi, dve postavicky naraz
 * v kole 3 (pod sebou) posobili chaoticky.
 * Kolo 10 (Samuel: sklad je rozmixovany a inak priblizeny ako kancelaria, pohyb ma byt rovnako rychly, panacika pustit
 * neskor): jedna kamera pre kancelariu aj sklad (C2_CAM, bez pomaleho najazdu), prestrih dole je cisty posun. Platna skladu
 * je zvacsena o WH_K, aby mierka sveta aj panacik zodpovedali kancelarii (sklad 1,7 px/cm, kancelaria 1,96 px/cm, panacik
 * 1,4 vs 1,25; 1,09 = oboje do 6 %). Panacik pocas prestrihu stoji v polovici ulicky a potom ide k regalu rovnakou
 * rychlostou a s rovnakym rozbehom ako v kancelarii (ease-in-out, rovnaka priemerna rychlost na obrazovke), dojde pri
 * "na polici". Az ked palety, ostatne regaly a panacik vyblednu (cas skladu 6600-7100), kamera prejde na samotnu policu
 * (koniec ako v kole 9, C4 pokracuje bez zmeny). Vnutornu kameru skladu (6300-7200) rusi kamera pasu.
 */
const C2_PAN_AT = 3450; // ms klipu: prestrih dole do skladu
const C2_PAN_MS = 900;
const C2_CAM: Cam = { z: 1.55, fx: 1025, fy: 380, tx: 540, ty: 450 }; // kancelaria aj sklad; kolo 11: vyssie, podlaha konci v obraze
/** Podobnost p -> s * p + (x, y): pas -> ram (kamera), platna -> pas (sklad). */
type Sim = { s: number; x: number; y: number };
const simCam = (c: Cam): Sim => ({ s: S169 * c.z, x: c.tx - S169 * c.z * c.fx, y: c.ty - S169 * c.z * c.fy });
const simMul = (a: Sim, b: Sim): Sim => ({ s: a.s * b.s, x: a.s * b.x + a.x, y: a.s * b.y + a.y }); // a(b(p))
const simInv = (a: Sim): Sim => ({ s: 1 / a.s, x: -a.x / a.s, y: -a.y / a.s });
const simAt = (a: Sim, p: [number, number]): [number, number] => [a.s * p[0] + a.x, a.s * p[1] + a.y];
/** Rastuca funkcia na [0, 1]: x, pre ktore f(x) = y (bisekcia). */
const invert01 = (f: (x: number) => number, y: number) => {
  let lo = 0,
    hi = 1;
  for (let k = 0; k < 40; k++) {
    const m = (lo + hi) / 2;
    if (f(m) < y) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};
const WH_K = 1.09;
const WH_C: [number, number] = [1200, 425]; // stred zaberu skladu (ulicka, cielovy regal, palety) -> stred kancelarie
const WH_W: Sim = { s: WH_K, x: C2_CAM.fx - WH_K * WH_C[0], y: C2_CAM.fy - WH_K * WH_C[1] };
/** Cesta panacika v sklade (Warehouse: walk = tw(4300, 2200), kazdy usek PATH 1/5 parametra), dlzky v px sceny skladu. */
const WH_SEG = WH_PATH.slice(1).map((q, i) => {
  const [ax, ay] = iso(WH_PATH[i][0], WH_PATH[i][1], 0);
  const [bx, by] = iso(q[0], q[1], 0);
  return Math.hypot(bx - ax, by - ay) * SV;
});
const whDist = (param: number) => WH_SEG.reduce((d, len, i) => d + len * Math.min(1, Math.max(0, param * WH_SEG.length - i)), 0);
const whTime = (param: number) => 4300 + 2200 * invert01(easeInOut, param); // cas skladu, ked je panacik na parametri
const WH_P0 = 0.32; // kolo 11 (Samuel: panacik nech ide o 0,5-1 s dlhsie, nie pomalsie): zacina pri lavom okraji, ide ~1,75 s
const WH_D = whDist(1) - whDist(WH_P0); // ~411 px sceny skladu
/** Kancelaria: panacik prejde z iso(200, 260) ku skrini iso(210, 110) za 800 ms ease-in-out, mierka 1920 / 980. */
const OFFICE_WALK_PX = Math.hypot(160, -70) * (1920 / 980);
const C2_WALK_AT = C2_PAN_AT + 650; // chodza v sklade od konca prestrihu (sklad uz takmer cely v obraze)
const C2_WALK_MS = (800 * WH_D * WH_K) / OFFICE_WALK_PX; // ~1050 ms: rovnaka rychlost na obrazovke ako v kancelarii
const C2_ARR = C2_WALK_AT + C2_WALK_MS; // panacik pri regali (cas skladu 6500)
const C2_UP = 7820; // cas skladu: zlozky v oboch krabiciach su hore
const C2_WMAP: [number, number][] = [
  [0, whTime(WH_P0)],
  [C2_WALK_AT, whTime(WH_P0)],
  ...Array.from({ length: 20 }, (_, i): [number, number] => {
    const e = (i + 1) / 20;
    return [C2_WALK_AT + C2_WALK_MS * e, whTime(invert01(whDist, whDist(WH_P0) + WH_D * easeInOut(e)))];
  }),
  [C2_ARR + (C2_UP - 6500), C2_UP], // 1:1: vyblednutie skladu, krabice, veka a zlozky hore
  [C2_ARR + (C2_UP - 6500) + 50, 8500], // staticka chvila so zlozkami hore 780 -> 50 ms (ticho pred "Hladanie...")
  [C2_ARR + (C2_UP - 6500) + 50 + 373, 9620], // zlozky dole, veka a krabice spat 3x
];
const C2_SECONDS = C2_WMAP[C2_WMAP.length - 1][0] / 1000;
const mapMs = (map: [number, number][], ms: number) => {
  for (let i = 1; i < map.length; i++) {
    const [a, sa] = map[i - 1];
    const [b, sb] = map[i];
    if (ms < b) return sa + ((Math.max(a, ms) - a) * (sb - sa)) / (b - a);
  }
  const [a, sa] = map[map.length - 1];
  return sa + (ms - a);
};
/** Vnutorna kamera skladu (Camera vo Warehouse: 6300-7200 ms na CAM_END, stred 960 x 540) ako podobnost. */
const whCam = (w: number): Sim => {
  const e = easeInOut(Math.min(1, Math.max(0, (w - 6300) / 900)));
  const k = 1 + (CAM_END.scale - 1) * e;
  return { s: k, x: 960 * (1 - k) - k * CAM_END.x * e, y: 540 * (1 - k) - k * CAM_END.y * e };
};
const WH_N0 = simMul(simCam(C2_CAM), WH_W); // sklad v zabere kancelarie
const WH_N1 = simMul(simCam(C2_END_CAM), whCam(1e9)); // polica ako na zaciatku C4
const WH_T: [number, number] = [CAM_END.x + 960, CAM_END.y + 540]; // bod police, na ktory ide vnutorna kamera
const C2_PUSH: [number, number] = [C2_ARR + 500, 600]; // prechod na policu (cas skladu 7000-7600), sklad uz takmer vybledol
/**
 * Kamera pasu: sklad ma v kazdom case zaber net(ms) (do C2_PUSH ako kancelaria, potom najazd na policu po zaciatok C4).
 * Vnutornu kameru skladu rusi obal priamo okolo sceny (vnutri orezanej platne), inak by bolo vidiet okraj platne.
 */
const c2Shift = (ms: number) => {
  const e = easeInOut(Math.min(1, Math.max(0, (ms - C2_PUSH[0]) / C2_PUSH[1])));
  const a = simAt(WH_N0, WH_T),
    b = simAt(WH_N1, WH_T);
  const k = WH_N0.s * Math.pow(WH_N1.s / WH_N0.s, e);
  const net: Sim = { s: k, x: a[0] + (b[0] - a[0]) * e - k * WH_T[0], y: a[1] + (b[1] - a[1]) * e - k * WH_T[1] };
  const band = simMul(net, simInv(WH_W));
  return { x: band.x, y: band.y - BAND.y, s: band.s / S169 };
};
const LI_C2: React.FC = () => {
  const frame = useCurrentFrame();
  const pan = tween(frame, C2_PAN_AT, C2_PAN_MS);
  const w = mapMs(C2_WMAP, (frame / FPS) * 1000);
  const fw = (w / 1000) * FPS;
  const un = simInv(whCam(w)); // zrusi vnutornu kameru skladu
  return (
    <Scene mode="dark">
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${-1080 * pan}px)` }}>
        {pan < 1 ? (
          <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, overflow: 'hidden' }}>
            <Office frame={frame} />
          </div>
        ) : null}
        {pan > 0 ? (
          <div style={{ position: 'absolute', left: 0, top: 1080, width: 1920, height: 1080, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0', transform: `translate(${WH_W.x}px, ${WH_W.y}px) scale(${WH_W.s})` }}>
              <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0', transform: `translate(${un.x}px, ${un.y}px) scale(${un.s})` }}>
                <Freeze frame={fw}>
                  <Warehouse frame={fw} />
                </Freeze>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Scene>
  );
};
/**
 * Kolo 8 (Samuel: pri predstaveni je vela prazdneho miesta, kde sa nic nedeje): pod logom pri vete "Z vasho archivu urobime
 * prehladny digitalny katalog" Vas archiv -> Digitalny katalog (ikona pri slove "archivu", sipka pri "urobime", katalog
 * pri "prehladny"), odide spolu s logom. Casy slov z K-C4-Cena-1.words.json.
 */
const C4_W1 = { archivu: 3.36, urobime: 3.88, prehladny: 4.44 };
const C4Promise: React.FC<{ out: number }> = ({ out }) => {
  const frame = useCurrentFrame();
  const L1 = voAt('K-C4-Cena', 1);
  const arch = settle(frame, L1 + C4_W1.archivu * 1000 - 150);
  const arrow = tween(frame, L1 + C4_W1.urobime * 1000 - 100, 450);
  const cat = settle(frame, L1 + C4_W1.prehladny * 1000 - 150);
  const item = (icon: OfferIconKind, label: string, t: number) => (
    <div style={{ width: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: t, transform: `translateY(${(1 - t) * 18}px)` }}>
      <OfferIcon kind={icon} on size={124} />
      <div style={{ marginTop: 18, fontFamily: FONT.display, fontWeight: 700, fontSize: 34, color: INK[900], whiteSpace: 'nowrap' }}>{label}</div>
    </div>
  );
  if (arch <= 0.001 || out >= 1) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 710, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', opacity: 1 - out }}>
      {item('box', 'Váš archív', arch)}
      <svg width={150} height={124} viewBox="0 0 150 124" style={{ flex: 'none' }}>
        <path d="M14 62 H128" fill="none" stroke={BRAND[500]} strokeWidth={7} strokeLinecap="round" strokeDasharray={114} strokeDashoffset={114 * (1 - arrow)} />
        <path d="M108 42 L132 62 L108 82" fill="none" stroke={BRAND[500]} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" opacity={arrow > 0.85 ? 1 : 0} />
      </svg>
      {item('catalog', 'Digitálny katalóg', cat)}
    </div>
  );
};
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
      <C4Promise out={out} />
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
  const web = settle(frame, 500);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${BRAND[800]} 0%, ${BRAND[600]} 100%)`, alignItems: 'center', justifyContent: 'center', fontFamily: FONT.body, color: '#fff' }}>
      <div style={{ marginTop: -40, opacity: logo, transform: `translateY(${(1 - logo) * 14}px) scale(${0.96 + 0.04 * logo})` }}>
        <Lockup size={94} onDark />
      </div>
      <div style={{ marginTop: 60, width: 900, textAlign: 'center', fontFamily: FONT.display, fontWeight: 600, fontSize: 44, lineHeight: 1.2, color: BRAND[100], opacity: tag, transform: `translateY(${(1 - tag) * 12}px)` }}>{SLOGAN}</div>
      {/* kolo 8 (Samuel: web na konci urcite ano): web pod sloganom, pocas filmu uz nie je */}
      <div style={{ marginTop: 70, padding: '14px 34px', borderRadius: 40, border: '2px solid rgba(255,255,255,0.45)', fontFamily: FONT.display, fontWeight: 700, fontSize: 42, letterSpacing: '0.01em', color: '#fff', opacity: web, transform: `translateY(${(1 - web) * 12}px)` }}>{sk.S12.web}</div>
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
  // kolo 6: kamera ramca priblizi panacika; kolo 8: bez vety "Vy viete, ze tam niekde je.", sklad rychlejsie (C2_FAST)
  { def: paced('K-C2-Hladanie', { scene: LI_C2, seconds: C2_SECONDS, stills: [], ...noSubs }), band: true, tone: () => 'dark', shift: c2Shift, win: INTRO_WIN, overflow: true },
  { def: paced('K-C4-Cena', { scene: K_C4_FAST, seconds: c4End(K_C4_D, K_C4_H) - C4_SKIP / 1000, stills: [], ...noSubs }), band: true, tone: (ms) => (ms < C4_LIGHT ? 'dark' : 'light'), toWhite: C4_LIGHT, toWhiteMs: 60, shift: c4Cam, win: c4Win, top: C4Top, subsOut: [C4_WIPE - 120, voAt('K-C4-Cena', 1)], rowOut: [C4_WIPE + WIPE_MS, C4_BRAND_OUT + 300] },
  // okno od nadpisu kroku (spodok ~200 px) po titulky: veko krabice pri priblizeni kamery vyjde nad ramec 16:9
  { def: paced('K-C5-Teren', { scene: C5_BAND, seconds: 8.4, holds: K_C5_HOLDS, stills: [], ...noSubs }), band: true, tone: () => 'light', steps: C5_STEPS('K-C5-Teren'), phase: PHASE_ARCHIV, shift: c5Shift, win: { top: 138, bottom: 1030, feather: 18 }, overflow: true, overlay: C5Hierarchy },
  { def: paced('K-F1-Sken', { scene: LI_F1, seconds: K_F1_SECONDS, vo: false, stills: [] }), tone: () => 'light', steps: F1_STEPS, phase: PHASE_ARCHIV },
  { def: paced('K-F24-Aplikacia', { scene: LI_F24, seconds: K_F24_END, stills: [], ...noSubs }), tone: () => 'light', steps: K_F24_STEPS, phase: phases.app },
  { def: paced('K-F3-Vyhladavanie', { scene: LI_F3, seconds: K_F3_SECONDS, stills: [], ...noSubs }), tone: () => 'light', steps: f3Steps(F3_CLIP), phase: phases.search, labelOut: true },
  // kolo 7: tri slidy s nazvom nad obrazom; pri vyzve su jej slova v obraze, titulky by ich len opakovali
  { def: paced('K-C8-Ponuka', { scene: LI_C8, seconds: C8_SECONDS, stills: [], ...noSubs }), tone: () => 'light', steps: C8_STEPS, phase: offer.kicker, subsOut: [C8_SLIDE[1], 1e9] },
  // zaver: hlas "Assetin Archives." = logo v obraze, preto bez titulkov
  { def: paced('K-C9-Outro', { scene: LI_C9, seconds: 3.0, stills: [], ...noSubs }), tone: () => 'dark', chrome: false, subs: false }, // kolo 10: 3,0 s (hlas konci v 2,0 s, web od 0,5 s)
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
          <StepLabel steps={d.steps} frame={frame} />
        </div>
      ) : null}
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
