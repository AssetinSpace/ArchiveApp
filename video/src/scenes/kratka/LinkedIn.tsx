import React from 'react';
import { AbsoluteFill, Easing, Freeze, Img, OffthreadVideo, Series, staticFile, useCurrentFrame } from 'remotion';
import { Scene, SceneFrameContext } from '../../components/Scene';
import { voLines } from '../../components/Subtitles';
import { FOOTAGE_PHONE, PHONE_BEZEL, PhoneFrame, Rect, WindowFrame } from '../../components/Device';
import { BrandMod, BrandSep, BrandStack, LOCKUP, LOCKUP_W } from '../../components/Brand';
import { ArchiveBox } from '../../components/ArchiveBox';
import { Office, PATH as WH_PATH, Warehouse } from '../C2_Hladanie';
import { CAM_END, SV, VB } from '../C3_Sklad';
import { Floor, PriceTag, Sheet } from '../../components/Illustrations';
import { iso } from '../../lib/iso';
import { C5_Teren } from '../C5_Teren';
import type { C5Step } from '../C5_Teren';
import { markAt, tapAt } from '../F2_Metadata';
import type { Mark, Tap } from '../F2_Metadata';
import type { Step } from '../../components/Steps';
import type { Hold } from '../../components/Paced';
import { cutDuration, segStart } from '../../lib/cuts';
import { C5_STEPS, SLOGAN, K_C4, K_C4For, K_C4_D, K_C4_H, K_C5_HOLDS, K_F1_SECONDS, K_F1_TAPS, K_F24_END, K_F24_MARKS, K_F24_STEPS, K_F24_TAPS, K_F3_SECONDS, PHASE_ARCHIV, SOFTWARE_DESC, c4End, f3Marks, f3Steps } from './Kratka';
import { paced } from '../../kratkaList';
import { ARCHIVES_LOGO } from './archivesLogo';
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
 * Kolo 12: plynuly koniec skladu a zaciatok C4 (zlozky spat 1,75x, C4 bez skoku casu, hodiny hned za otaznikom cez
 * `clockAt`), v F3 nova nahravka s prirodzenou pauzou za "polozke".
 * Kolo 13: pomale priblizenie otaznika a hodin, mekksi a pomalsi zeleny prechod, priblizene okno aplikacie (vyrez ide za
 * hlasom), vacsi mobil, prelinacka F3 -> ponuka, kratsia ponuka a "v sulade s vasimi bezpecnostnymi poziadavkami",
 * vacsia znacka vpravo hore.
 * Kolo 14: kancelaria a sklad na jednej spolocnej plosine (kamera ide po tej istej podlahe), znacka vpravo dole bez domceka.
 * Kolo 15: namiesto chvile s otaznikom a hodinami most "S nami ho najdete za par sekund." so zelenym prechodom ("Hladanie moze
 * trvat hodiny." uz pri navrate zloziek, pomaly najazd na policu), pod logom pilulka "Prve dokumenty zadarmo a nezavazne",
 * web pod vyzvou.
 * Kolo 20: znacka vpravo dole domcek | assetin ako v podpise mailu, v logu "archives" malym ako "assetin" (hudba kola 15).
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
  xfadeIn?: number; // kolo 13: ms, o ktore sa klip prekryje s predchadzajucim a cely sa v nich prelinie (F3 -> C8 bez bielej)
  subInk?: (ms: number) => number; // kolo 15: farba titulkov 0 = biela, 1 = tmava (C4: titulok mosta pocas zeleneho prechodu)
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
/**
 * Okno pasu v uvode (C2, C4): od riadku znacky po titulky, priblizeny obsah ma miesto nad aj pod pasom (kolo 11: 90 az
 * 1040 px s prechodom 30 px). Kolo 30 (Samuel: horny prechod v sklade a dolny v kancelarii nepusobia prirodzene): okno je
 * cely ramec bez prechodu. Znacka uz nie je hore (od kola 14 vpravo dole), podlaha kancelarie ide pod titulky za dolny
 * okraj a plosina skladu za horny okraj ako pri zabere kamerou; titulky su na tmavej podlahe citatelne (biele na #263246).
 */
const INTRO_WIN: Win = { top: 0, bottom: LI.h, feather: 0 };

/**
 * Znacka. Kolo 8 (Samuel: znacku dat malu dole doprava): mala v pravom dolnom rohu. Kolo 11 (Samuel: v celom videu do
 * praveho horneho rohu domcek s textom assetin, male, decentne, ale jasne): vpravo hore na vysku nadpisu kroku.
 * Kolo 13 (Samuel: logo vpravo hore je teraz prilis male): domcek 46 px, text 42 px.
 * Kolo 14 (Samuel: logo vpravo dole, bez domceka, pismom a vyskou nech pekne sedi): len slovo assetin pismom velkeho loga
 * (Manrope 800, -0,02 em), 42 px, vpravo 48 px ako nadpis kroku zlava; uaziara je od spodku ramca tak daleko ako vrch
 * pismen nadpisu od vrchu (BRAND_BASE), takze nadpis a znacka su v protilahlych rohoch sumerne. Pod titulkami (koncia
 * ~1200 px), v F1 je mobil posunuty dolava.
 * Kolo 20 (Samuel: domcek za ciarou ako v podpise mailu): domcek | assetin v pomeroch velkeho loga (domcek 0,9 F, ciara
 * vysoka ako pismo, rozostup 0,3 F), slovo assetin ostava na mieste (uaziara BRAND_BASE, 48 px od praveho okraja).
 */
const BRAND_BASE = 57; // px od spodku ramca po uaziaru (vrch pismen nadpisu kroku je ~57 px od vrchu)
/**
 * Kolo 26 (Samuel: nove logá): domcek | assetin presne z oficialneho jednoriadkoveho loga (asset hrubo, in tenko).
 * Kolo 29 (Samuel: aj vpravo dole logo s archives): finalne dvojriadkove logo (domcek | assetin nad ARCHIVES), vysoke 60 px,
 * takze assetin je velke ako predtym (vyska x 24 px, predtym 23,7) a ARCHIVES pod nim (verzalky 16 px, na mobile ~8 bodov).
 * Uaziara ARCHIVES je na BRAND_BASE (spodok loga sumerne s vrchom nadpisu kroku), vpravo 48 px, sirka 237 px, vrch loga
 * 1233 px (titulky koncia ~1200). Na tmavom uvode verzia na tmavomodru, inak na bielu. Mobil v F1 je preto uzsi (PHONE_TO).
 */
const BRAND_H = 60;
const BrandRow: React.FC<{ tone: Tone }> = ({ tone }) => {
  const k = BRAND_H / ARCHIVES_LOGO.two.view[1];
  return (
    <div style={{ position: 'absolute', right: 48, bottom: BRAND_BASE - 0.6 * k }}>
      <Lockup height={BRAND_H} colors={tone === 'dark' ? 'inverse' : 'color'} />
    </div>
  );
};

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

/** Zmes dvoch farieb #rrggbb (t = 0 prva, 1 druha). */
const mixHex = (a: string, b: string, t: number) => {
  const ch = (h: string, i: number) => parseInt(h.slice(1 + 2 * i, 3 + 2 * i), 16);
  return `rgb(${[0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t)).join(',')})`;
};
/**
 * Velke titulky pod obrazom: casy a casti ako Subtitles (vo_kratka.json), biela na tmavom, ink na svetlom. Kolo 15: `ink`
 * = plynula farba medzi bielou (0) a tmavou (1), ked sa pozadie pod titulkom meni pocas prechodu.
 */
const BigSubtitles: React.FC<{ clip: string; tone: Tone; ink?: number }> = ({ clip, tone, ink }) => {
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
    <div style={{ position: 'absolute', left: 56, right: 56, top: SUB_Y, textAlign: 'center', fontFamily: FONT.display, fontWeight: 700, fontSize: 58, lineHeight: 1.18, letterSpacing: '-0.01em', color: ink !== undefined ? mixHex('#ffffff', INK[900], ink) : tone === 'dark' ? '#fff' : INK[900], opacity: t, transform: `translateY(${(1 - t) * 10}px)` }}>
      {text}
    </div>
  );
};


/**
 * Detail pod oknom aplikacie (kolo 4, Samuel: vystrizky zo zaznamu boli rozmazane): stitok nad, zeleny ramik. Obsah je
 * ostry: fotka titulnej strany je vyrez zo zaznamu mobilu (1206 x 2622, ten isty dokument ako v aplikacii), polia
 * aplikacie (navrh hodnoty, hladane slovo) su prekreslene jej pismom podla zaznamu, cesta k dokumentu je nakreslena.
 */
/** Kolo 34: `lift` (px) a `liftAt` (s): panel sa vysunie nahor cez zbledene okno (jedna vec naraz, test bez zvuku: okno + karta + titulok naraz je privela). */
const Panel: React.FC<{ from: number; to: number; label: string; width: number; children: React.ReactNode; lift?: number; liftAt?: number }> = ({ from, to, width, children, lift = 0, liftAt }) => {
  const frame = useCurrentFrame();
  const a = settle(frame, from * 1000) * (1 - tween(frame, to * 1000 - 250, 250));
  if (a <= 0.001) return null;
  const up = lift ? lift * tween(frame, (liftAt ?? from) * 1000, 450, easeInOut) : 0;
  // kolo 8: stitok nad detailom vypadol (label ostava ako popis v kode), detail je v strede pasma medzi oknom a titulkami
  return (
    <div style={{ position: 'absolute', left: (LI.w - width) / 2, top: CALL_Y + 20, width, opacity: a, transform: `translateY(${(1 - a) * 14 - up}px)` }}>
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
const ValueField: React.FC<{ approveAt: number; authorAt: number; yearAt: number; editAt?: number }> = ({ approveAt, authorAt, yearAt, editAt }) => {
  const frame = useCurrentFrame();
  const ok = settle(frame, approveAt * 1000);
  const tick = pop(frame, approveAt * 1000 + 80);
  const edit = editAt !== undefined ? pop(frame, editAt * 1000 - 80) : 0; // kolo 36 (K46): ceruzka pri "alebo upravi"
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
      {edit > 0 ? (
        <div style={{ position: 'absolute', right: 128, top: 22, width: 84, height: 84, borderRadius: 42, background: '#fff', border: `3px solid ${BRAND[500]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: Math.min(1, edit * 1.4), transform: `scale(${0.4 + 0.6 * edit})`, boxShadow: '0 8px 20px rgba(31,122,51,0.2)' }}>
          <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke={BRAND[600]} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z" />
            <path d="M13.5 6.5l3 3" />
          </svg>
        </div>
      ) : null}
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
/** Kolo 33 (K46): `iconsAt` = ms klipu, kedy pride ktora ikona (predvolene slova vety K), `qrAt` = ms prvej nalepky QR, `arrange` = priklady usporiadania. */
const C5HierarchyBase: React.FC<{ clip: string; outAt: number; iconsAt?: number[]; qrAt?: number; arrange?: boolean }> = ({ clip, outAt, iconsAt, qrAt, arrange = true }) => {
  const frame = useCurrentFrame();
  const line = voAt(clip, 0);
  const out = tween(frame, outAt, 350);
  if (out >= 1) return null;
  const at = (s: number) => line + s * 1000;
  const wa = arrange ? tween(frame, at(C5_ARRANGE.a) - 80, 260) * (1 - tween(frame, at(C5_ARRANGE.b) - 80, 260)) : 0; // priklad A
  const wb = arrange ? tween(frame, at(C5_ARRANGE.b) - 80, 260) * (1 - tween(frame, at(C5_ARRANGE.all), 320)) : 0; // priklad B
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: 840, display: 'flex', justifyContent: 'space-between', opacity: 1 - out }}>
      {C5_ITEMS.map((it, i) => {
        const t = settle(frame, iconsAt ? iconsAt[i] : at(C5_WORDS[i]) - 120);
        const qr = settle(frame, (qrAt ?? at(C5_QR)) + i * 90); // "dostane QR kod"
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
/** Ikony odidu 500 ms po zaciatku vety o foteni (kolo 8: veta o foteni je samostatna, pauza pred nou). */
const C5Hierarchy: React.FC = () => <C5HierarchyBase clip="K-C5-Teren" outAt={voAt('K-C5-Teren', 1) + 500} />;

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
/**
 * Kolo 8 (Samuel: mobil je maly a zle orezany, titulky tu nie su): vacsi, na vysku od nadpisu po znacku dole.
 * Kolo 13 (Samuel: okno aplikacie nemusi byt cele, "orez inak ten mobil"; test: fotka v mobile je tmava a drobna): mobil
 * 800 px (predtym 575), presahuje dolny okraj ramca; displej zacina tesne nad hladacikom (orez 250 px zaznamu namiesto
 * stavovej listy 115 px), dokument je ~1,4x vacsi a spust je stale v obraze.
 */
const PHONE_TO: Rect = { x: 50, y: 138, w: 720, h: (720 * 1040) / 575 }; // kolo 14: 740 px, posunuty dolava (vpravo dole je znacka); kolo 20: x 50 (lavy okraj pri nadpise), znacka s domcekom je sirsia; kolo 29: 720 px, logo s ARCHIVES v rohu je od 795 px (medzera 25 px)
const REC_PHONE = { w: 884, h: 1920, cropTop: 250 / 1920 }; // zaznam mobilu, orez nad hladacikom fotoaparatu
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
  // kolo 8 (test: biely preblik pri prechode z mobilu do aplikacie): kratke vyblednutie do bielej na konci. Kolo 22 (Samuel:
  // v 0:34 akoby sa dokument odfotil dvakrat): biele vyblednutie na konci vypadlo, okno F24 sa cez mobil prelinie (F1_XFADE).
  // Kolo 23 (Samuel: stale dvakrat): druha fotka bol nas biely blesk 0,33 s po skutocnom bliknuti iOS v zazname, vypadol;
  // jedina fotka je bliknutie v zazname, kruzok spuste (K_F1_TAPS) je tesne pred nim.
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
          <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 1 - screenIn }} />
        </div>
      </PhoneFrame>
    </AbsoluteFill>
  );
};

/**
 * Kolo 13 (Samuel: okno aplikacie nemusi byt cele vidiet, kludne ho zvacsi; testeri: cele okno je na mobile drobne):
 * zaznam v okne WIN je priblizeny na vyrez zdroja (po oreze 1764 x 882, vyrez 2:1 ako obsah okna) a vyrez sa v case
 * posuva za tym, o com hovori hlas (kluce `views`, ease-in-out). Zvyraznenia a kliky su v podieloch obsahu (ako
 * v DesktopFootageClip), kreslia sa v px okna, aby mali stale rovnaky ramik. Na konci nevybledne (F24 -> F3 v tom istom
 * okne, F3 -> C8 prelinacka).
 */
type FootView = { t: number; x: number; y: number; w: number }; // s klipu; lavy horny roh a sirka vyrezu v px zdroja
const FOOT_SRC = { w: 1764, h: 882 };
const footViewAt = (keys: FootView[], t: number) => {
  if (t <= keys[0].t) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1],
      b = keys[i];
    if (t < b.t) {
      const e = easeInOut((t - a.t) / (b.t - a.t));
      const w = a.w * Math.pow(b.w / a.w, e); // priblizenie rovnomerne v mierke
      const f = (a.w - w) / (a.w - b.w || 1); // stred vyrezu ide s mierkou, aby okraj neuhol na opacnu stranu
      const g = a.w === b.w ? e : f;
      return { t, x: a.x + (b.x - a.x) * g, y: a.y + (b.y - a.y) * g, w };
    }
  }
  return keys[keys.length - 1];
};
const LiFootage: React.FC<{ src: string; views: FootView[]; marks?: Mark[]; taps?: Tap[]; dimAt?: number }> = ({ src, views, marks = [], taps = [], dimAt }) => {
  const frame = useCurrentFrame();
  const v = footViewAt(views, frame / FPS);
  const dim = dimAt !== undefined ? 1 - 0.85 * tween(frame, dimAt * 1000, 450) : 1; // kolo 34: okno zbledne, ked kartu vysunie Panel
  const cw = WIN.w,
    ch = WIN.h - 44;
  const k = cw / v.w; // px okna na px zdroja
  const X = (fx: number) => (fx * FOOT_SRC.w - v.x) * k,
    Y = (fy: number) => (fy * FOOT_SRC.h - v.y) * k;
  const tw = (s0: number, d: number) => tween(frame, s0, d);
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: dim }}>
      <WindowFrame at={WIN}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#fff' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: FOOT_SRC.w, height: FOOT_SRC.h, transformOrigin: '0 0', transform: `translate(${-v.x * k}px, ${-v.y * k}px) scale(${k})` }}>
            <OffthreadVideo src={staticFile(src)} muted style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
          </div>
          {marks.map((m, i) => {
            const a = tw(m.from * 1000, 200) * (1 - tw(m.to * 1000 - 250, 250));
            if (a <= 0) return null;
            const p = (m.pad ?? 8) * Math.min(1.6, k / 0.585);
            return <div key={`m${i}`} style={{ position: 'absolute', left: X(m.x) - p, top: Y(m.y) - p, width: m.w * FOOT_SRC.w * k + 2 * p, height: m.h * FOOT_SRC.h * k + 2 * p, borderRadius: 12, border: `4px solid ${m.color === 'amber' ? '#F59E0B' : BRAND[400]}`, boxShadow: `0 0 0 4000px rgba(15,23,42,${0.38 * a})`, opacity: Math.min(1, a * 1.5), transform: `scale(${1.02 - 0.02 * a})`, pointerEvents: 'none' }} />;
          })}
          {taps.map((tp, i) => {
            const t = tw(tp.t * 1000, 550);
            if (t <= 0 || t >= 1) return null;
            const r = 22 + 80 * t;
            return <div key={`t${i}`} style={{ position: 'absolute', left: X(tp.x) - r, top: Y(tp.y) - r, width: 2 * r, height: 2 * r, borderRadius: '50%', border: `3px solid ${BRAND[400]}`, background: `rgba(79,168,90,${0.28 * (1 - t)})`, opacity: 1 - t * t, pointerEvents: 'none' }} />;
          })}
        </div>
      </WindowFrame>
      </div>
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
/**
 * Vyrezy zaznamu kontroly (px zdroja po oreze, ~2,1x): nadpis na fotke, navrh nazvu projektu, lupa na fotke a hodnota,
 * tlacidla prijatia (klik na fajku). Test kola 13 pri 1,6x: okno je na mobile stale drobne.
 */
const F24_VIEWS: FootView[] = (() => {
  const photo = { x: 120, y: 360, w: 840 },
    form = { x: 700, y: 380, w: 840 },
    both = { x: 150, y: 250, w: 840 },
    accept = { x: 910, y: 380, w: 840 };
  const L0 = kv(0),
    L01 = kv(0, 1),
    L1 = kv(1),
    L11 = kv(1, 1);
  return [
    { t: 0, ...photo },
    { t: L01 - 0.2, ...photo }, // "z fotky sama precita text"
    { t: L01 + 0.6, ...form }, // "a navrhne udaje": nazov projektu, autor, rok
    { t: L1 - 0.1, ...form },
    { t: L1 + 0.7, ...both }, // "Clovek kazdu hodnotu overi" (lupa na fotke)
    { t: L11 + 0.3, ...both },
    { t: L11 + 1.1, ...accept }, // "a pripadne opravi alebo potvrdi": klik na fajku
    { t: L0 + 99, ...accept },
  ];
})();
/** F24: okno so zaznamom a panely pod nim; `L0` = zaciatok vety o aplikacii (s), `L01` = jej cast "a navrhne udaje" (s). */
/** Kolo 34 (K46): `focusAt` (s) = okno zbledne a karta sa vysunie do jeho miesta; `approveAt` = potvrdenie (predvolene prvy klik). */
const LI_F24Base: React.FC<{ src: string; views: FootView[]; taps: Tap[]; marks: Mark[]; end: number; L0: number; L01: number; focusAt?: number; approveAt?: number; editAt?: number }> = ({ src, views, taps, marks, end, L0, L01, focusAt, approveAt, editAt }) => (
  <AbsoluteFill>
    {/* kolo 3: okno na konci nevybledne do bielej, F3 nadvazuje v tom istom okne; kolo 13: priblizeny vyrez */}
    <LiFootage src={src} views={views} taps={taps} marks={marks} dimAt={focusAt} />
    <Panel from={0.5} to={L01 + 0.1} label="Na fotke" width={720}>
      <PhotoTitle width={720} />
    </Panel>
    {/* navrh ostava az po potvrdenie (klik na slove "potvrdi"); kolo 9: panel s fotkou pri zazname vypadol (duplicita) */}
    <Panel from={L01 + 0.35} to={end} label="Návrh aplikácie: názov projektu" width={WIN.w} lift={focusAt !== undefined ? CALL_Y + 20 - 300 : 0} liftAt={focusAt}>
      <ValueField approveAt={approveAt ?? taps[0].t} authorAt={L0 + F24_W0.autora - 0.1} yearAt={L0 + F24_W0.rok - 0.1} editAt={editAt} />
    </Panel>
  </AbsoluteFill>
);
const LI_F24: React.FC = () => <LI_F24Base src={F24_SRC} views={F24_VIEWS} taps={K_F24_TAPS} marks={K_F24_MARKS} end={K_F24_END} L0={kv(0)} L01={kv(0, 1)} />;

/**
 * F3 na vysku: cely zaznam v okne, pod nim hladane slovo (pise sa v case ako v zazname). Kolo 7 (Samuel: aplikacia ukaze
 * konkretne udaje o polozke a cestu ku konkretnej polozke): karta najdenej polozky podla zaznamu (ZL_03, Zlozka,
 * najdene v udajoch a v texte z fotky, priloha = fotka titulnej strany) pri "udaje o konkretnej polozke", potom cesta
 * Polica PL_01 -> Krabica KR_01 -> Zlozka ZL_03 (drobcek z aplikacie) pri "aj cestu k nej".
 */
const F3_CLIP = 'K-F3-Vyhladavanie';
const F3_SRC = 'footage/k-f3-search.mp4';
const F3_WORDS = { cestu: 0.26, k: 0.6, nej: 0.66 }; // s od zaciatku vety "aj cestu k nej." (kolo 12: nova nahravka s prirodzenou pauzou za "polozke", rez v tichu 70 ms pred "aj")
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
/**
 * Kolo 13 (~2,1x): hladane slovo, pri "a aplikacia ukaze udaje" vysledok ZL_03 s drobcekom, pri "aj cestu k nej"
 * priblizenie na drobcek PL_01 / KR_01 / ZL_03.
 */
const F3_VIEWS: FootView[] = (() => {
  const search = { x: 0, y: 330, w: 840 },
    result = { x: 20, y: 462, w: 840 },
    crumb = { x: 380, y: 560, w: 620 };
  const v1 = voAt(F3_CLIP, 0, 1) / 1000,
    path = voAt(F3_CLIP, 1) / 1000;
  return [
    { t: 0, ...search },
    { t: v1 + 0.3, ...search },
    { t: v1 + 1.1, ...result }, // "a aplikacia ukaze udaje o konkretnej polozke"
    { t: path - 0.2, ...result },
    { t: path + 0.8, ...crumb }, // "aj cestu k nej"
    { t: 99, ...crumb },
  ];
})();
/** Kolo 34 (K46): `focus` = pri karte najdenej polozky okno zbledne a karta aj cesta sa vysunu do jeho miesta. */
const LI_F3Base: React.FC<{ src: string; seconds: number; marks: Mark[]; focus?: boolean }> = ({ src, seconds, marks, focus = false }) => {
  const v = (k: number) => voAt(F3_CLIP, 0, k) / 1000;
  const path = voAt(F3_CLIP, 1) / 1000; // kolo 10: "aj cestu k nej." po pauze (kolo 12: 0,7 s, "polozke" prirodzene doznie), karta polozky sa da docitat
  const lift = focus ? CALL_Y + 20 - 260 : 0;
  return (
    <AbsoluteFill>
      {/* kolo 3: bez `enter` (okno je na rovnakom mieste ako v F24, test: 0:45 biela diera pred vyhladavanim) */}
      <LiFootage src={src} views={F3_VIEWS} marks={marks} dimAt={focus ? v(1) + 0.3 : undefined} />
      <Panel from={0.25} to={v(1) + 0.25} label="Hľadané slovo" width={WIN.w}>
        <SearchField typeFrom={0.8} typeTo={1.9} />
      </Panel>
      {/* kolo 12: karta o 0,15 s skor (pauza pred "aj cestu k nej" je kratsia), vidno ju 3,6 s */}
      <Panel from={v(1) + 0.3} to={path + 0.05} label="Nájdená položka" width={WIN.w} lift={lift}>
        <ItemCard />
      </Panel>
      <Panel from={path + 0.1} to={seconds + 1} label="Cesta k položke" width={WIN.w} lift={lift} liftAt={path - 9}>
        <DocPath lineAt={path} />
      </Panel>
    </AbsoluteFill>
  );
};
const LI_F3: React.FC = () => <LI_F3Base src={F3_SRC} seconds={K_F3_SECONDS} marks={f3Marks(F3_CLIP)} />;

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
 * Kolo 24: nadpis druheho slidu "Technicke riesenie" namiesto "Kde to bezi" (na slide su bezpecnost a moznosti prevadzky,
 * nie parametre, preto nie "Technicka specifikacia"). Kolo 25: nadpis prveho slidu "Spracovanie archivu" namiesto "Kto to spracuje".
 */
const C8_CLIP = 'K-C8-Ponuka';
const C8L = (i: number, k = 0) => voAt(C8_CLIP, i, k);
const C8_SLIDE = [C8L(2) - 350, C8L(3) - 350]; // prechod na 2. a 3. slide (tesne pred vetou)
/** Hlasova stopa klipu konci 0,6 s po poslednej vete. */
const clipEndSeconds = (clip: string, tail = 0.6) => {
  const lines = voLines(clip);
  const last = lines[lines.length - 1];
  return (last.at + (last.dur ?? 4000)) / 1000 + tail;
};
/** Casy slov (ms od zaciatku vety, public/vo-kratka/lines/K-C8-Ponuka-2/3.words.json). */
const C8_W2 = { bezpecne: 1360, online: 4000, na: 5440 }; // kolo 13: nova veta, "v sulade", "online", "na vasej"
const C8_W3 = { krabicou: 1120, zadarmo: 2040 };
/** Kolo 13: prvy slide je hotovy uz na zaciatku klipu, prelinacka z F3 (C8_XFADE) ho odhali naraz s nadpisom. */
const C8_XFADE = 500;
/** Kolo 22: prelinanie mobilu (F1) do okna aplikacie (F24), 12 snimok; F1 drzi posledny zaber o tolko dlhsie (cuts.json). */
const F1_XFADE = 400;
const C8_STEPS = [
  { from: -9999, title: 'Spracovanie archívu' }, // kolo 25 (Samuel): namiesto hovoroveho "Kto to spracuje"
  { from: C8_SLIDE[0], title: 'Technické riešenie' }, // kolo 24 (Samuel: nadpis "Kde to bezi" je infantilny, napr. technicka specifikacia)
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
 * Kolo 13 (Samuel: k bezpecnosti "v sulade s vasimi bezpecnostnymi poziadavkami"): podnadpis aj veta hlasu.
 */
const SafeBanner: React.FC<{ top: number; on: boolean }> = ({ top, on }) => (
  <div style={{ position: 'absolute', left: C8X, top, width: C8W, height: 150, boxSizing: 'border-box', borderRadius: 26, background: on ? BRAND[100] : BRAND[50], border: `2px solid ${on ? BRAND[500] : BRAND[200]}`, boxShadow: on ? `0 0 0 2px ${BRAND[500]}, 0 18px 44px rgba(31,122,51,0.16)` : 'none', display: 'flex', alignItems: 'center', gap: 28, padding: '0 40px' }}>
    <OfferIcon kind="shield" on size={100} />
    <div>
      <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 56, lineHeight: 1.05, letterSpacing: '-0.02em', color: BRAND[700] }}>Bezpečne</div>
      <div style={{ marginTop: 8, fontFamily: FONT.body, fontSize: 31, lineHeight: 1.2, color: INK[600], whiteSpace: 'nowrap' }}>V súlade s vašimi bezpečnostnými požiadavkami</div>
    </div>
  </div>
);
/**
 * Zelena pilulka s fajkou (vyzva "Zadarmo a nezavazne"). Kolo 15: spolocna pre vyzvu na konci aj pilulku pod logom
 * ("Prve dokumenty zadarmo a nezavazne"), aby ju divak pri vyzve spoznal; `size` = velkost pisma, okraje v pomere.
 */
const FreePill: React.FC<{ text: string; size?: number }> = ({ text, size = 54 }) => {
  const k = size / 54;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 * k, padding: `${22 * k}px ${44 * k}px`, borderRadius: 999, background: `linear-gradient(160deg, ${BRAND[700]} 0%, ${BRAND[600]} 100%)`, boxShadow: '0 18px 40px rgba(31,122,51,0.25)', fontFamily: FONT.display, fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: '-0.01em', color: '#fff', whiteSpace: 'nowrap' }}>
      <svg width={52 * k} height={52 * k} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
        <path d="M4.5 12.5 L10 18 L19.5 6.5" />
      </svg>
      {text}
    </div>
  );
};
const OrPill: React.FC<{ top: number; t: number }> = ({ top, t }) => (
  <div style={{ position: 'absolute', left: (LI.w - 104) / 2, top, width: 104, height: 50, borderRadius: 25, background: '#fff', border: `2px solid ${INK[200]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.body, fontWeight: 600, fontSize: 26, color: INK[500], opacity: t }}>alebo</div>
);
/**
 * Slide "Prvy krok": krabica, nalepka QR pri slove "krabicou", pilulka pri "zadarmo", web 0,45 s po nom. `lineAt` = zaciatok
 * vety "Zacnime jednou krabicou..." (ms klipu); spolocny pre K (treti slide) aj K46 (jediny slide ponuky).
 */
/** Kolo 34 (K46): `who` = riadok pod pilulkou ("Na kluc, alebo vlastnymi silami"; spravcovi v teste chybalo, kto to urobi). */
const C8FirstStep: React.FC<{ lineAt: number; who?: string }> = ({ lineAt, who }) => {
  const frame = useCurrentFrame();
  const head = settle(frame, lineAt - 100);
  const sticker = pop(frame, lineAt + C8_W3.krabicou - 100);
  const free = pop(frame, lineAt + C8_W3.zadarmo - 150, { damping: 16 });
  const web = settle(frame, lineAt + C8_W3.zadarmo + 450);
  return (
    <>
      <ArchiveBox state={{ lid: 0, binders: [0, 0, 0], qr: [0, 0, 0, sticker] }} size={700} style={{ position: 'absolute', left: (LI.w - 700) / 2, top: 156 }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 832, textAlign: 'center', fontFamily: FONT.display, fontWeight: 800, fontSize: 76, lineHeight: 1.05, letterSpacing: '-0.02em', color: INK[900], opacity: head, transform: `translateY(${(1 - head) * 24}px)` }}>
        Začnime <span style={{ color: BRAND[600] }}>jednou krabicou</span>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: who ? 950 : 966, display: 'flex', justifyContent: 'center', opacity: Math.min(1, free * 1.5), transform: `scale(${0.85 + 0.15 * free})` }}>
        <FreePill text="Zadarmo a nezáväzne" />
      </div>
      {who ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1052, textAlign: 'center', fontFamily: FONT.body, fontWeight: 500, fontSize: 34, color: INK[600], opacity: web, transform: `translateY(${(1 - web) * 10}px)` }}>{who}</div>
      ) : null}
      {/* kolo 15 (laik v teste: kam sa ozvat): web pod pilulkou, ako na zaverecnom logu */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: who ? 1112 : 1108, display: 'flex', justifyContent: 'center', opacity: web, transform: `translateY(${(1 - web) * 12}px)` }}>
        <div style={{ padding: '12px 32px', borderRadius: 40, border: `2px solid ${INK[200]}`, fontFamily: FONT.display, fontWeight: 700, fontSize: 42, letterSpacing: '0.01em', color: INK[800] }}>{sk.S12.web}</div>
      </div>
    </>
  );
};
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
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      {slide(
        0,
        <>
          <OptionCard icon="box" title={offer.service.title} desc="Spracujeme za vás" top={220} h={260} t={1} on={ms >= C8_XFADE && ms < C8L(1)} />
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
      {slide(2, <C8FirstStep lineAt={C8L(3)} />)}
    </AbsoluteFill>
  );
};

/**
 * Logo (kolo 4, Samuel): domcek | assetin | archives (kolo 20 "archives" malym). Kolo 6: `build` = ms klipu, od ktoreho sa
 * logo posklada (ciara narastie, domcek dosadne, riadky vyjdu zospodu z masky); bez neho je logo hotove (C9).
 * Kolo 26 (Samuel: nove logá, do videa to, kde su assetin a archives nad sebou): oficialne dvojriadkove logo
 * (podklady/archives-logo, cesty v archivesLogo.ts): domcek | assetin nad ARCHIVES. Farebna verzia na bielej (C4),
 * inverzna na tmavomodrej (C9). `height` = vyska loga v px (sirka 3,96 x vyssia).
 * Kolo 27 (Samuel: finalne loga, zelene ARCHIVES prepisane na navy): farby z podklady/archives-logo-final, ARCHIVES je na
 * bielej tmavomodre (#121a2b ako asset), na tmavomodrej biele; tvary bez zmeny. Kolo 28: `colors` = verzia loga
 * (C9 znova na zelenej: verzia na zelenu, cele biele).
 */
const OUT_EXPO = Easing.bezier(0.16, 1, 0.3, 1);
const HOUSE_C = { x: 35.8, y: 38.4 }; // stred domceka v dvojriadkovom logu (x 0 az 71,7, y 0 az 76,85)
type LogoColors = 'color' | 'inverse' | 'onGreen'; // na bielej, na tmavomodrej, na zelenej (finalne podklady)
const Lockup: React.FC<{ height: number; colors?: LogoColors; build?: number }> = ({ height, colors = 'color', build }) => {
  const frame = useCurrentFrame();
  const id = 'lk' + React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const L = ARCHIVES_LOGO.two;
  const c = L[colors];
  const [VW, VH] = L.view;
  const k = height / VH;
  const b = (a: number, d: number) => (build === undefined ? 1 : tween(frame, build + a, d, OUT_EXPO));
  const sepK = b(0, 480);
  const markK = build === undefined ? 1 : pop(frame, build + 60, { damping: 18 });
  const w1 = b(150, 650); // assetin (y 0 az 41,6)
  const w2 = b(300, 650); // ARCHIVES (y 56,3 az 77,3)
  const [dx, dy, dw, dh] = L.divider;
  const mid = dy + dh / 2;
  return (
    <svg width={VW * k} height={(VH + 0.6) * k} viewBox={`0 0 ${VW} ${VH + 0.6}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <clipPath id={`${id}a`}>
          <rect x={110} y={-6} width={VW - 104} height={52} />
        </clipPath>
        <clipPath id={`${id}b`}>
          <rect x={110} y={50} width={VW - 104} height={32} />
        </clipPath>
      </defs>
      <g opacity={Math.min(1, markK * 1.6)} transform={`translate(${HOUSE_C.x} ${HOUSE_C.y}) scale(${0.45 + 0.55 * markK}) translate(${-HOUSE_C.x} ${-HOUSE_C.y})`}>
        <g transform={L.houseTransform} fill={c.house}>
          <path d={ARCHIVES_LOGO.houseD} />
        </g>
      </g>
      <rect x={dx} y={dy} width={dw} height={dh} fill={c.divider} transform={`translate(0 ${mid}) scale(1 ${sepK}) translate(0 ${-mid})`} />
      <g clipPath={`url(#${id}a)`}>
        <g transform={`translate(0 ${(1 - w1) * 50})`} opacity={Math.min(1, w1 * 1.6)}>
          <path d={L.asset} fill={c.asset} />
          <path d={L.in} fill={c.in} />
        </g>
      </g>
      <g clipPath={`url(#${id}b)`}>
        <g transform={`translate(0 ${(1 - w2) * 30})`} opacity={Math.min(1, w2 * 1.6)}>
          <path d={L.archives} fill={c.archives} />
        </g>
      </g>
    </svg>
  );
};

/**
 * C4 v kolach 6 az 14: "Hladanie moze trvat hodiny." na zaciatku C4, kamera na skupinu regal, otaznik a hodiny (kolo 12:
 * zaciatok sceny 1,55x bez skoku, kolo 13: pomale priblizenie), zeleny prechod 110 ms po slove "hodiny".
 * Kolo 15 (Samuel: namiesto hodin most "S nami ho najdete za par sekund."; testeri: pri otazniku a hodinach sa len caka):
 * veta o hodinach je uz v C2 pri navrate zloziek, C4 zacina zelenym prechodom a mostom (hlas od 0,3 s). Scena C4 stoji na
 * prvom obraze (polica ako na konci C2, otaznik ani hodiny sa neobjavia), kym ju zelena cela neprekryje (C4_JUMP), potom
 * skoci na predel (5600 + K_C4_D ms sceny) a dalej bezi 1:1 (Freeze na case sceny, scena C4 sa nemeni).
 */
/**
 * Kolo 6 (Samuel: logo pri 0:14 nema "horiet" ako svetlo, ma prist profesionalnejsie): cisty prechod zdola nahor, najprv
 * zeleny pas znacky, WHITE_AFTER ms za nim biely (ostre hrany, WIPE_MS), potom sa logo posklada. Prechod je nad znackou a webom
 * ramca; pod bielou sa scena C4 prelinie do bielej (predel C4 = koniec zelenej) a ramec prepne farby (C4_LIGHT).
 */
/**
 * Kolo 13 (Samuel: zeleny prechod na logo zapracovat; testeri: na mobile prudky, "ako strihova chyba"): 800 ms namiesto
 * 480, mekksia krivka a makka horna hrana (WIPE_FEATHER px).
 */
const WIPE_MS = 800;
const WIPE_FEATHER = 110;
const WHITE_AFTER = 220; // test kola 6 (laik: z tmavej do bielej ako zablesk): chvilu cela zelena, biela az za nou
const WIPE_EASE = Easing.bezier(0.45, 0, 0.25, 1);
const C4_WIPE = 0; // kolo 15: hned na zaciatku C4 (C2 konci 110 ms po slove "hodiny"), most "S nami..." od 300 ms
const C4_JUMP = C4_WIPE + WIPE_MS; // zelena zakryje cely ramec
const C4_SKIP = 5600 + K_C4_D - C4_JUMP; // po skoku: cas sceny = cas klipu + C4_SKIP (predel sceny pod zelenou ako v kole 13)
const c4SceneMs = (ms: number) => (ms < C4_JUMP ? 0 : ms + C4_SKIP);
const k4LiFor = (Scene: React.FC): React.FC => () => {
  const frame = useCurrentFrame();
  return (
    <Freeze frame={(c4SceneMs((frame / FPS) * 1000) / 1000) * FPS}>
      <Scene />
    </Freeze>
  );
};
const K_C4_LI = k4LiFor(K_C4);
const C4_LIGHT = C4_WIPE + WHITE_AFTER + WIPE_MS; // biela zakryje cely ramec: ramec prepne farby, pas bez priblizenia
const C4_PANEL_OUT = C4_WIPE + WIPE_MS + 630; // scena C4 je cela biela (prelinacka 600 ms), biela vrstva zmizne
const C4_LOGO = C4_WIPE + WHITE_AFTER + Math.round(0.55 * WIPE_MS); // logo sa zacne skladat, ked biela prejde jeho miesto
const c4BrandOut = (h: number) => 7900 + K_C4_D + h - C4_SKIP - 50; // odchod loga (C4 brandOut) - 50 ms
const C4_BRAND_OUT = c4BrandOut(K_C4_H);
/**
 * Pas na konci C2 a v C4: priblizena polica (kolo 8, Samuel: v sklade, ked tam hlada, to nie je dost priblizene: 1,8x),
 * pod bielou bez priblizenia.
 */
const C2_END_CAM: Cam = { z: 1.8, fx: 960, fy: 450, tx: 540, ty: 600 };
/**
 * Okno pasu C4: pocas priblizenia vacsie (INTRO_WIN), pod bielou znova pas s makkymi okrajmi. Scena C4 je tmava s bielou
 * prelinackou, jej okraj (878,5 px) by na bielom ramci ostal ako tenka siva ciara; okno pasu ho skryje ako v kole 5.
 */
const c4Win = (ms: number) => (ms < C4_LIGHT ? INTRO_WIN : BAND_WIN);
/** Kolo 15: pomaly najazd z C2 (slowZoom okolo bodu police C2_Q) pokracuje, kym obraz neprekryje zelena; pod bielou CAM_ID. */
const c4ShiftFor = (c2Seconds: number, zoom: (t: number) => number) => (ms: number) => {
  if (ms >= C4_LIGHT) return camShift([[0, CAM_ID]])(ms);
  const k = S169 * C2_END_CAM.z; // ten isty zaber ako C2_END_CAM, len s bodom police C2_Q na jeho mieste v ramci
  const cam: Cam = { z: C2_END_CAM.z * zoom(c2Seconds * 1000 + ms), fx: C2_END_CAM.fx + (C2_Q[0] - C2_END_CAM.tx) / k, fy: C2_END_CAM.fy + (C2_Q[1] - C2_END_CAM.ty) / k, tx: C2_Q[0], ty: C2_Q[1] };
  return camShift([[0, cam]])(ms);
};
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
const WH_C: [number, number] = [1200, 470]; // stred zaberu skladu (ulicka, cielovy regal, palety) -> stred kancelarie; kolo 31: o 45 vyssie (zaber skladu o 43 px hore)
const WH_W: Sim = { s: WH_K, x: C2_CAM.fx - WH_K * WH_C[0], y: C2_CAM.fy - WH_K * WH_C[1] };
/** Cesta panacika v sklade (Warehouse: walk = tw(4300, 2200), kazdy usek PATH 1/5 parametra), dlzky v px sceny skladu. */
const WH_SEG = WH_PATH.slice(1).map((q, i) => {
  const [ax, ay] = iso(WH_PATH[i][0], WH_PATH[i][1], 0);
  const [bx, by] = iso(q[0], q[1], 0);
  return Math.hypot(bx - ax, by - ay) * SV;
});
const whDist = (param: number) => WH_SEG.reduce((d, len, i) => d + len * Math.min(1, Math.max(0, param * WH_SEG.length - i)), 0);
const whTime = (param: number) => 4300 + 2200 * invert01(easeInOut, param); // cas skladu, ked je panacik na parametri
/** Kancelaria: panacik prejde z iso(200, 260) ku skrini iso(210, 110) za 800 ms ease-in-out, mierka 1920 / 980. */
const OFFICE_WALK_PX = Math.hypot(160, -70) * (1920 / 980);
const C2_WALK_AT = C2_PAN_AT + 650; // chodza v sklade od konca prestrihu (sklad uz takmer cely v obraze)
const C2_UP = 7820; // cas skladu: zlozky v oboch krabiciach su hore
/**
 * Kolo 34: geometria chodze v sklade ako funkcia startu `p0` (parameter cesty WH_PATH): K 0,32 (kolo 11, Samuel: panacik nech
 * ide o 0,5-1 s dlhsie; ~684 px, ~1,75 s), K46 0,5 (ako v kole 10, ~411 px, ~1,05 s; bez zvuku bol sklad 4-8 s prazdny).
 * Rovnaka rychlost na obrazovke ako v kancelarii; z nej prichod k regalu, zdvihnutie zloziek, prechod na policu a pomaly najazd.
 */
type C2Geo = { p0: number; d: number; walkMs: number; arr: number; upAt: number; push: [number, number]; slowZoom: (t: number) => number };
const c2Geo = (p0: number): C2Geo => {
  const d = whDist(1) - whDist(p0);
  const walkMs = (800 * d * WH_K) / OFFICE_WALK_PX;
  const arr = C2_WALK_AT + walkMs; // panacik pri regali (cas skladu 6500)
  const upAt = arr + (C2_UP - 6500); // ms klipu: zlozky hore
  const push: [number, number] = [arr + 500, 600]; // prechod na policu (cas skladu 7000-7600), sklad uz takmer vybledol
  // kolo 15: pomaly najazd na policu, 300 ms pred koncom prechodu sa rozbehne (900 ms) na +3,5 % za sekundu okolo C2_Q
  const slow = { at: push[0] + push[1] - 300, ramp: 900, rate: 0.035 / 1000 };
  const slowZoom = (t: number) => {
    const u = Math.max(0, t - slow.at);
    return 1 + slow.rate * (u < slow.ramp ? (u * u) / (2 * slow.ramp) : u - slow.ramp / 2);
  };
  return { p0, d, walkMs, arr, upAt, push, slowZoom };
};
const C2_GEO = c2Geo(0.32);
const WH_P0 = C2_GEO.p0;
const WH_D = C2_GEO.d; // ~684 px sceny skladu
const C2_WALK_MS = C2_GEO.walkMs; // ~1744 ms
const C2_ARR = C2_GEO.arr; // ~5844
const C2_UP_AT = C2_GEO.upAt; // ~7164
/** Kolo 12 (Samuel: zlozky sa vratia do krabice prilis rychlo, 0:07-0:10 rozsekane): navrat 1120 ms sceny za 640 ms (1,75x,
 * v kole 11 3x za 373 ms, v kole 10 2,5x), chvila so zlozkami hore 150 ms (v kole 11 50). Pocas oboch zmien rychlosti
 * sa v sklade nic nehybe (zlozky su hore, krabice dnu), takze nie je vidiet ziadny skok. */
/**
 * Kolo 15 (Samuel: veta o hodinach pri navrate zloziek, bez chvile s hodinami): zlozky su hore pocas "...alebo v zlozke"
 * a pauzy (staticka chvila skladu 680 ms sceny na 0,74 s, nic sa nehybe, obraz nesie pomaly najazd), navrat zloziek, veka
 * a krabic ide 1:1 (1120 ms, v kole 12 1,75x) od 70 ms po zaciatku vety "Hladanie moze trvat hodiny." (7,83 s), C2 konci
 * 110 ms po slove "hodiny" (9,42 s), kde zacina zeleny prechod C4.
 */
/**
 * Mapa casu klipu -> cas skladu. `backAt` = ms klipu, kedy sa zlozky zacnu vracat (150 ms po zaciatku vety o hodinach),
 * `endMs` = koniec klipu (koniec vety o hodinach, zaokruhli sa na cely snimok). K46 (verzia okolo 46 s) ma vetu
 * o hodinach hned po zdvihnuti zloziek, preto vlastny plan s tou istou chodzou a navratom.
 */
const c2Plan = (backAt: number, endMs: number, g: C2Geo = C2_GEO, backSpeed = 1) => {
  const end = (Math.round((endMs / 1000) * FPS) * 1000) / FPS; // cely snimok (K: 286)
  const back = 1120 / backSpeed; // kolo 34 (K46): navrat zloziek, viek a krabic 1,25x
  const wmap: [number, number][] = [
    [0, whTime(g.p0)],
    [C2_WALK_AT, whTime(g.p0)],
    ...Array.from({ length: 20 }, (_, i): [number, number] => {
      const e = (i + 1) / 20;
      return [C2_WALK_AT + g.walkMs * e, whTime(invert01(whDist, whDist(g.p0) + g.d * easeInOut(e)))];
    }),
    [g.upAt, C2_UP], // 1:1: vyblednutie skladu, krabice, veka a zlozky hore
    [backAt, 8500], // staticka chvila so zlozkami hore
    [backAt + back, 9620], // zlozky dole, veka a krabice spat
    [end, 9620 + end - backAt - back], // polica v pokoji
  ];
  return { wmap, seconds: end / 1000 };
};
const C2_BACK_AT = 7900;
const C2_PLAN = c2Plan(C2_BACK_AT, 9530);
const C2_WMAP = C2_PLAN.wmap;
const C2_SECONDS = C2_PLAN.seconds;
const c4Shift = c4ShiftFor(C2_SECONDS, C2_GEO.slowZoom); // az tu: C2_SECONDS a C2_GEO musia byt deklarovane
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
const C2_Q = simAt(WH_N1, WH_T); // bod police v ramci na konci prechodu (stred najazdu)
/**
 * Kolo 15 (namiesto priblizenia otaznika a hodin v kole 13): pomaly najazd na policu, 300 ms pred koncom prechodu na policu
 * sa rozbehne (900 ms) na +3,5 % za sekundu okolo C2_Q a ide cez vetu o hodinach az pod zeleny prechod v C4 (spolu ~+11 %),
 * aby polica so zlozkami nestala. `t` = cas filmu (ms), C2 zacina v 0.
 */
const slowZoom = C2_GEO.slowZoom; // kolo 34: v c2Geo (K46 ma vlastnu geometriu)
/**
 * Kamera pasu: sklad ma v kazdom case zaber net(ms) (do C2_PUSH ako kancelaria, potom najazd na policu po zaciatok C4).
 * Vnutornu kameru skladu rusi obal priamo okolo sceny (vnutri orezanej platne), inak by bolo vidiet okraj platne.
 */
const c2ShiftFor = (g: C2Geo) => (ms: number) => {
  const e = easeInOut(Math.min(1, Math.max(0, (ms - g.push[0]) / g.push[1])));
  const a = simAt(WH_N0, WH_T),
    b = simAt(WH_N1, WH_T);
  const k = WH_N0.s * Math.pow(WH_N1.s / WH_N0.s, e);
  const net: Sim = { s: k, x: a[0] + (b[0] - a[0]) * e - k * WH_T[0], y: a[1] + (b[1] - a[1]) * e - k * WH_T[1] };
  const z = g.slowZoom(ms);
  const band = simMul(simMul({ s: z, x: C2_Q[0] * (1 - z), y: C2_Q[1] * (1 - z) }, net), simInv(WH_W));
  return { x: band.x, y: band.y - BAND.y, s: band.s / S169 };
};
const c2Shift = c2ShiftFor(C2_GEO);
/**
 * Kolo 14 (Samuel: plosina skladu vyzera uplne inak ako v kancelarii a zda sa, ze z nej vypadne skrina so sanonmi): pri
 * prestrihu dole boli dve samostatne dosky tesne nad sebou (medzera ~50 px), kancelaria posobila ako polica nad skladom;
 * kancelaria aj sklad potom stali na jednej spolocnej plosine (SharedFloor).
 * Kolo 30 (Samuel: logickejsie je, ked maju plosiny viditelny roh hore aj dole nad textom): kazda miestnost ma znova
 * vlastnu podlahu (Floor v Office a Warehouse, rovnake farby a hrubka), roh kancelarie je v obraze na 187 a 990 px,
 * skladu na 111 a 1015 px (titulky od 1060; od kola 31 68 a 1021 px), bocne rohy su za okrajom ramca. Proti "polici nad skladom" su plosiny pri
 * posune od seba o C2_GAP px platne a prelinaju sa: kancelaria pocas posunu nahor zmizne (C2_PAN_AT + 100, 450 ms),
 * sklad sa zospodu vynori (C2_PAN_AT + 350, 450 ms), takze obe dosky nie su nikdy naraz naplno.
 */
const C2_GAP = 300; // px platne medzi kancelariou a skladom (predtym 0, dosky boli ~50 px od seba)
const WH_PAD = 70; // zadny roh podlahy skladu je nad jeho platnou (kolo 31: 58 px): orez skladu siaha o tolko vyssie
/**
 * Kolo 31 (Samuel: police v sklade posunut dalej od spodneho okraja): treti regal (x 380 az 510) presahoval hranu podlahy
 * (x 500) o 10 cm. Police su spolocne s povodnou verziou (C3_Sklad), preto sa nehybu; kratka verzia kresli vlastnu,
 * o WH_FLOOR_DX sirsiu podlahu skladu (regal 50 cm od hrany) a zaber skladu je o 43 px vyssie (WH_C): predny roh
 * 1021 px (s hranou 1034, titulky od 1060), zadny 68 px. Cesta panacika, priblizenie na policu aj C4 bez zmeny.
 */
const WH_FLOOR_DX = 60;
const LI_C2Base: React.FC<{ wmap: [number, number][] }> = ({ wmap }) => {
  const frame = useCurrentFrame();
  const pan = tween(frame, C2_PAN_AT, C2_PAN_MS);
  const offA = 1 - tween(frame, C2_PAN_AT + 100, 450); // kolo 30: kancelaria pri posune nahor zmizne
  const whA = tween(frame, C2_PAN_AT + 350, 450); // sklad sa zospodu vynori
  const w = mapMs(wmap, (frame / FPS) * 1000);
  const fw = (w / 1000) * FPS;
  const un = simInv(whCam(w)); // zrusi vnutornu kameru skladu
  return (
    <Scene mode="dark">
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${-(1080 + C2_GAP) * pan}px)` }}>
        {pan < 1 ? (
          <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, overflow: 'hidden', opacity: offA }}>
            <Office frame={frame} />
          </div>
        ) : null}
        {pan > 0 ? (
          <div style={{ position: 'absolute', left: 0, top: 1080 + C2_GAP - WH_PAD, width: 1920, height: 1080 + WH_PAD, overflow: 'hidden', opacity: whA }}>
            <div style={{ position: 'absolute', left: 0, top: WH_PAD, width: 1920, height: 1080, transformOrigin: '0 0', transform: `translate(${WH_W.x}px, ${WH_W.y}px) scale(${WH_W.s})` }}>
              {/* kolo 31: sirsia podlaha skladu (ako Floor vo Warehouse, vybledne s paletami a regalmi) */}
              <svg width={1920} height={1080} viewBox={`${VB.x} ${VB.y} ${1920 / SV} ${1080 / SV}`} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: 1 - tween(fw, 6600, 500) }}>
                <Floor x={-60} y={-60} w={560 + WH_FLOOR_DX} d={560} fill="#263246" edge="#131F31" />
              </svg>
              <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0', transform: `translate(${un.x}px, ${un.y}px) scale(${un.s})` }}>
                <Freeze frame={fw}>
                  <Warehouse frame={fw} floor={false} />
                </Freeze>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Scene>
  );
};
const LI_C2: React.FC = () => <LI_C2Base wmap={C2_WMAP} />;
/**
 * Kolo 8 (Samuel: pri predstaveni je vela prazdneho miesta, kde sa nic nedeje): pod logom pri vete "Z vasho archivu urobime
 * prehladny digitalny katalog" Vas archiv -> Digitalny katalog (ikona pri slove "archivu", sipka pri "urobime", katalog
 * pri "prehladny"), odide spolu s logom. Casy slov z K-C4-Cena-1.words.json.
 * Kolo 15: pod logom a sloganom je pilulka "Prve dokumenty zadarmo a nezavazne" (C4_Y.pill), ikony su nizsie (C4_Y.promise).
 */
/** Kolo 15: rozlozenie pod logom (px ramca): logo so sloganom, pilulka, archiv -> katalog, pod nimi titulky (SUB_Y). */
const C4_Y = { logo: 300, pill: 600, promise: 752 }; // kolo 26: dvojriadkove logo 168 px (predtym riadok 88 px od 372)
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
    <div style={{ position: 'absolute', left: 0, right: 0, top: C4_Y.promise, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', opacity: 1 - out }}>
      {item('box', 'Váš archív', arch)}
      <svg width={150} height={124} viewBox="0 0 150 124" style={{ flex: 'none' }}>
        <path d="M14 62 H128" fill="none" stroke={BRAND[500]} strokeWidth={7} strokeLinecap="round" strokeDasharray={114} strokeDashoffset={114 * (1 - arrow)} />
        <path d="M108 42 L132 62 L108 82" fill="none" stroke={BRAND[500]} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" opacity={arrow > 0.85 ? 1 : 0} />
      </svg>
      {item('catalog', 'Digitálny katalóg', cat)}
    </div>
  );
};
/**
 * Kolo 15 (Samuel: namiesto "na obmedzenom rozsahu" ci "Prva krabica" radsej "Prve dokumenty zadarmo a nezavazne"): ponuka
 * na skusku uz pri logu, kde este pozera vacsina divakov, len v obraze a bez hlasu (hlasom zaznie az vyzva na konci). Ta ista
 * zelena pilulka ako pri vyzve, mensia; pride 0,3 s po zaciatku vety "Predstavujeme vam..." (logo a slogan uz stoja) a odide s logom.
 */
const c4PillAt = (clip: string) => voAt(clip, 1) + 300;
/** Biela vrstva prechodu v bode ramca vo vyske y (0 az 1), pre farbu titulkov mosta. */
const c4WhiteAt = (ms: number, y: number) => {
  const w = WIPE_EASE(Math.min(1, Math.max(0, (ms - C4_WIPE - WHITE_AFTER) / WIPE_MS)));
  return w <= 0 ? 0 : Math.min(1, Math.max(0, (y - (LI.h - LI.h * w - WIPE_FEATHER)) / WIPE_FEATHER));
};
/** Kolo 15: titulok mosta je biely na tmavom a na zelenom a stmavne, ked cez neho prejde biela vrstva. */
const c4SubInk = (ms: number) => (ms >= C4_LIGHT ? 1 : c4WhiteAt(ms, SUB_Y + 36));
/** Kolo 33 (K46): `clip` = hlas (pilulka 0,3 s po druhej vete), `h` = drzanie loga v scene, `promise` = ikony archiv -> katalog (len s vetou o katalogu). */
/** Kolo 35 (K46): logo so sloganom vycentrovane zvislo v casti nad titulkami a pod nimi riadok `who` (kto to urobi), aby zaber nebol prazdny. */
const C4_Y46 = { logo: 400, whoGap: 56 }; // kolo 36: bez pilulky, blok logo + slogan (244 px) v strede casti nad titulkami
const C4TopBase: React.FC<{ clip: string; h: number; promise: boolean; pill?: boolean; center?: boolean; who?: string; whoAt?: number }> = ({ clip, h, promise, pill: withPill = true, center = false, who, whoAt = 0 }) => {
  const frame = useCurrentFrame();
  const ms = (frame / FPS) * 1000;
  const g = WIPE_EASE(Math.min(1, Math.max(0, (ms - C4_WIPE) / WIPE_MS)));
  const w = WIPE_EASE(Math.min(1, Math.max(0, (ms - C4_WIPE - WHITE_AFTER) / WIPE_MS)));
  const panel = 1 - tween(frame, C4_PANEL_OUT, 250);
  const out = tween(frame, c4BrandOut(h), 300);
  const tag = tween(frame, C4_LOGO + 650, 900, OUT_EXPO) * (1 - out);
  const pill = withPill ? pop(frame, c4PillAt(clip), { damping: 16 }) : 0; // K46 kolo 34: klip ma len jednu vetu, pilulka je len pri vyzve
  const whoT = who ? settle(frame, whoAt) : 0;
  return (
    <>
      {/* kolo 13: makka horna hrana (priehladny prechod WIPE_FEATHER px), pri g = 1 je nad ramcom */}
      {g > 0 && w < 1 ? <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: LI.h * g + WIPE_FEATHER, background: `linear-gradient(to top, ${BRAND[600]} calc(100% - ${WIPE_FEATHER}px), rgba(31,122,51,0) 100%)` }} /> : null}
      {w > 0 && panel > 0 ? <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: LI.h * w + WIPE_FEATHER, background: `linear-gradient(to top, #fff calc(100% - ${WIPE_FEATHER}px), rgba(255,255,255,0) 100%)`, opacity: panel }} /> : null}
      {ms >= C4_LOGO && out < 1 ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: center ? C4_Y46.logo : C4_Y.logo, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 1 - out }}>
          <Lockup height={168} build={C4_LOGO} />
          {/* kolo 26: slogan vetou a sivo, verzalky s rozostupom by pod ARCHIVES posobili ako dalsi riadok loga */}
          <div style={{ marginTop: 36, fontFamily: FONT.body, fontWeight: 500, fontSize: 34, color: INK[600], opacity: tag, transform: `translateY(${(1 - tag) * 10}px)`, whiteSpace: 'nowrap' }}>{SLOGAN}</div>
          {who ? (
            <div style={{ marginTop: C4_Y46.whoGap, padding: '16px 40px', borderRadius: 44, border: `3px solid ${BRAND[500]}`, background: BRAND[50], fontFamily: FONT.body, fontWeight: 700, fontSize: 40, color: BRAND[800], opacity: whoT, transform: `translateY(${(1 - whoT) * 14}px)`, whiteSpace: 'nowrap' }}>{who}</div>
          ) : null}
        </div>
      ) : null}
      {withPill && pill > 0 && out < 1 ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: C4_Y.pill, display: 'flex', justifyContent: 'center', opacity: Math.min(1, pill * 1.5) * (1 - out), transform: `scale(${0.85 + 0.15 * pill})` }}>
          <FreePill text="Prvé dokumenty zadarmo a nezáväzne" size={40} />
        </div>
      ) : null}
      {promise ? <C4Promise out={out} /> : null}
    </>
  );
};
const C4Top: React.FC = () => <C4TopBase clip="K-C4-Cena" h={K_C4_H} promise />;

/**
 * C9 (kolo 3, Samuel: posledny zaber bol prehusteny): len logo a slogan na zelenej. Kolo 4: logo bez .space.
 * Kolo 26: oficialne dvojriadkove logo v inverznej verzii na tmavomodrej (NAVY ako tmavy uvod): inverzne logo je urobene na
 * tmavomodre pozadie, zelene ARCHIVES a domcek by na zelenej zanikli a biela verzia loga v podkladoch nie je.
 * Kolo 27: finalne podklady maju aj verziu na zelenu (ARCHIVES_LOGO.two.onGreen, cele biele na #1a7431).
 * Kolo 28 (Samuel: zaver zeleny ako bol): znova zeleny prechod BRAND[800] -> BRAND[600] a slogan BRAND[100] ako do kola 25,
 * logo vo verzii na zelenu.
 */
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
        <Lockup height={182} colors="onGreen" />
      </div>
      <div style={{ marginTop: 64, width: 900, textAlign: 'center', fontFamily: FONT.display, fontWeight: 600, fontSize: 44, lineHeight: 1.2, color: BRAND[100], opacity: tag, transform: `translateY(${(1 - tag) * 12}px)` }}>{SLOGAN}</div>
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
  // kolo 15: most "S nami..." ma titulky aj pocas zeleneho prechodu (subInk), predtym boli pocas prechodu skryte (subsOut)
  { def: paced('K-C4-Cena', { scene: K_C4_LI, seconds: c4End(K_C4_D, K_C4_H) - C4_SKIP / 1000, stills: [], ...noSubs }), band: true, tone: (ms) => (ms < C4_LIGHT ? 'dark' : 'light'), toWhite: C4_LIGHT, toWhiteMs: 60, shift: c4Shift, win: c4Win, top: C4Top, subInk: c4SubInk, rowOut: [C4_WIPE + WIPE_MS, C4_BRAND_OUT + 300] },
  // okno od nadpisu kroku (spodok ~200 px) po titulky: veko krabice pri priblizeni kamery vyjde nad ramec 16:9
  { def: paced('K-C5-Teren', { scene: C5_BAND, seconds: 8.4, holds: K_C5_HOLDS, stills: [], ...noSubs }), band: true, tone: () => 'light', steps: C5_STEPS('K-C5-Teren'), phase: PHASE_ARCHIV, shift: c5Shift, win: { top: 138, bottom: 1030, feather: 18 }, overflow: true, overlay: C5Hierarchy },
  { def: paced('K-F1-Sken', { scene: LI_F1, seconds: K_F1_SECONDS, vo: false, stills: [] }), tone: () => 'light', steps: F1_STEPS, phase: PHASE_ARCHIV },
  { def: paced('K-F24-Aplikacia', { scene: LI_F24, seconds: K_F24_END, stills: [], ...noSubs }), tone: () => 'light', steps: K_F24_STEPS, phase: phases.app, xfadeIn: F1_XFADE },
  // kolo 13 (Samuel: prechod do ponuky prelinanim, nie prebliknutie): F3 nevybledne, ponuka sa cez neho 500 ms prelinie
  { def: paced('K-F3-Vyhladavanie', { scene: LI_F3, seconds: K_F3_SECONDS, stills: [], ...noSubs }), tone: () => 'light', steps: f3Steps(F3_CLIP), phase: phases.search },
  // kolo 7: tri slidy s nazvom nad obrazom; pri vyzve su jej slova v obraze, titulky by ich len opakovali
  { def: paced('K-C8-Ponuka', { scene: LI_C8, seconds: C8_SECONDS, stills: [], ...noSubs }), tone: () => 'light', steps: C8_STEPS, phase: offer.kicker, subsOut: [C8_SLIDE[1], 1e9], xfadeIn: C8_XFADE },
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
  const xin = d.xfadeIn ? tween(frame, 0, d.xfadeIn) : 1;
  return (
    <AbsoluteFill style={{ background: NAVY[900], opacity: xin }}>
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
          <BigSubtitles clip={id} tone={tone} ink={d.subInk?.(ms)} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Kolo 13: prekrytie klipu s predchadzajucim (snimky), klip zacina o tolko skor. */
const liOverlap = (d: LiDef) => (d.xfadeIn ? Math.round((d.xfadeIn / 1000) * FPS) : 0);
const liFramesOf = (list: LiDef[]) => list.reduce((a, d) => a + Math.round(d.def[1].seconds * FPS) - liOverlap(d), 0);
/** Kolo 6: zaciatky klipov vo filme (s), pre strihy hudby na takt (music_kratka.json). */
const liStartsOf = (list: LiDef[]) => {
  let f = 0;
  return list.map((d) => {
    f -= liOverlap(d);
    const from = f / FPS;
    f += Math.round(d.def[1].seconds * FPS);
    return [d.def[0], from] as const;
  });
};
const filmOf = (list: LiDef[]): React.FC => () => {
  React.useEffect(() => {
    loadFonts();
  }, []);
  return (
    <Series>
      {list.map((d) => (
        <Series.Sequence key={d.def[0]} durationInFrames={Math.round(d.def[1].seconds * FPS)} offset={-liOverlap(d)}>
          <LiFrame d={d} />
        </Series.Sequence>
      ))}
    </Series>
  );
};
export const liFrames = () => liFramesOf(LI_LIST);
export const liStarts = () => liStartsOf(LI_LIST);
export const K_LinkedIn = filmOf(LI_LIST);

/**
 * Kolo 32 (Samuel: verzia okolo 46 s pre LinkedIn, bez novych nahravok, zredukovat to, co uz je): kompozicia K-LinkedIn-46.
 * Ta ista stavba, len z existujucich viet (src/copy/vo_kratka.json, klipy K46-*): v uvode otazka a hned "Hladanie moze
 * trvat hodiny." (veta o sklade vypadla, sklad ostava obrazom), C4 cely (most, logo, pilulka, "Z vasho archivu urobime
 * prehladny digitalny katalog."), v C5 len veta o QR (fotenie bez hlasu, mobil pride hned po nalepkach), v aplikacii len
 * veta "Aplikacia z fotky sama precita text..." a overenie a potvrdenie clovekom len v obraze (lupa, klik, zelena karta,
 * nadpis kroku "Overit a potvrdit"; zostrih k46-f24-review), vyhladavanie bez zmeny, ponuka len slide "Prvy krok"
 * (Zacnime jednou krabicou, zadarmo a nezavazne), zaver 2,5 s. Verzia K (77 s) sa nemeni.
 */
/**
 * Kolo 33 (Samuel: 55 s je vela; v uvode "V skrini? V sklade?"; QR bez vymenovania; musi zazniet, ze sa foti len titulna
 * strana; po vyhladavani dve fazy ako na produktovej stranke: viete, co mate, kde to je a co skartovat alebo uchovat,
 * skenuje sa az to, co treba; nove vety Gemini su v poriadku, ciel 48-50 s): nove vety v K46-* klipoch, veta o katalogu
 * vypadla (katalog nesie scena Dve fazy), C5 bez pauz a od 4000 ms 1,4x, F24 kratsi zostrih s klikom pri "potvrdi",
 * F3 kratsi dobeh, nova scena Dve fazy (LI_Fazy), ponuka a zaver kratsie.
 */
/** C2: otazky "V skrini?" "V sklade?" pocas chodze v sklade; veta o hodinach ~100 ms pred zdvihnutim zloziek (C2_UP_AT),
 * navrat zloziek 100 ms po zdvihnuti. `at` vety 3 v vo_kratka.json (7070) je C2_UP_AT - ~100; pri zmene chodze upravit aj tam. */
const C2_46_CLIP = 'K46-C2-Hladanie';
const C2_46_LINE = voAt(C2_46_CLIP, 2); // kolo 35: "V skrini alebo v archive?" je jedna veta, "Hladanie..." je tretia
/** Kolo 34: kratsia chodza (start 0,5 ako v kole 10, ~1,05 s) a navrat zloziek 1,25x; `at` vety o hodinach v JSON = upAt - ~100. */
const C2_46_GEO = c2Geo(0.5);
const C2_46 = c2Plan(Math.max(C2_46_LINE + 150, C2_46_GEO.upAt + 100), C2_46_LINE + (voLines(C2_46_CLIP)[2].dur ?? 1780), C2_46_GEO, 1.25);
const LI_C2_46: React.FC = () => <LI_C2Base wmap={C2_46.wmap} />;
/** C4: len "Predstavujeme vam Assetin Archives." (bez vety o katalogu), logo s pilulkou odide 0,6 s po vete (5,7 s klipu), bez ikon archiv -> katalog. */
const C4_46_CLIP = 'K46-C4-Cena';
/** Kolo 34: len jedna veta pri logu (most vypadol, hacik ho nahradza), bez pilulky (ostava pri vyzve). Kolo 35 (Samuel: vela
 * bieleho miesta, divny preklik po krabici): "Predstavujeme softverove riesenie Assetin Archives." od 0,6 s, logo so sloganom
 * vycentrovane a pod nimi riadok "Na kluc, alebo vlastnymi silami" pri slove "riesenie" (simulovane publikum: pri "softverove
 * riesenie" caka pracu navyse pre seba); logo odide 300 ms po vete, klip konci 20 ms po odchode loga a krabica sceny C4 sa
 * nekresli (`withBox`; v kole 34 prebleskla v poslednych snimkach). Logo odide 100 ms po vete, klip drzi bielu 260 ms a hacik sa cez nu
 * prelinie 250 ms (logo a stoh sa neprekryvaju). */
const C4_46_LINE_END = voAt(C4_46_CLIP, 0) + (voLines(C4_46_CLIP)[0].dur ?? 3840);
const K_C4_H46 = C4_46_LINE_END + 100 - (7900 + K_C4_D - C4_SKIP - 50); // c4BrandOut(h) = koniec vety + 100
const C4_46_SECONDS = (c4BrandOut(K_C4_H46) + 560) / 1000; // logo zmizne (300 ms) a biela drzi, hacik sa cez nu prelinie (250 ms), bez ducha loga cez stoh
const K_C4_LI46 = k4LiFor(K_C4For(K_C4_H46, false));
const C4Top46: React.FC = () => <C4TopBase clip={C4_46_CLIP} h={K_C4_H46} promise={false} pill={false} center />; // kolo 36 (Samuel): riadok "Na kluc..." prec, bude az na webe
/**
 * Hacik (kolo 34, Samuel: "vsetko naskenovat je drahe, my fotime len identifikacnu stranu a tvorime katalog, druha faza len kde
 * treba"; simulovane publikum: dovod ma zazniet do 0:20): tri obrazy na bielej pod nadpisom kroku, titulky dole.
 * (a) "Naskenovat cely archiv je drahe.": stoh listov, pri "drahe" cenovka EUR; (b) "My odfotime len jednu stranu z kazdeho
 * dokumentu a vznikne katalog.": vrchny list sa zdvihne, zeleny ramik a blesk pri "stranu", pri "katalog" karta polozky
 * (nazov, typ, cesta PL_01 / KR_01 / ZL_03), stoh zbledne; (c) "Skenuje sa az to, co naozaj potrebujete.": pod kartou tri
 * dokumenty, pri "az to" sa jeden zvyrazni s ikonou skenu, ostatne zblednu, pri "potrebujete" fajka.
 */
const HOOK_CLIP = 'K46-Hook';
const HOOK_W = { drahe: 2.32, archivu: 1.78, hospodarnejsi: 2.58 }; // s od zaciatku viet (K46-Hook-0 a -1 words)
const HOOK_SECONDS = (voAt(HOOK_CLIP, 1) + (voLines(HOOK_CLIP)[1].dur ?? 3840)) / 1000 + 0.25;
const HOOK_STEPS: Step[] = [
  { from: 0, title: 'Skenovať všetko je drahé' },
  { from: voAt(HOOK_CLIP, 1) - 100, title: 'Len identifikačná strana' },
];
const HOOK_PAGES = 1240; // pocitadlo stran pri skenovani celeho archivu
const fmtPages = (n: number) => `${Math.round(n).toLocaleString('sk-SK').replace(/\u00a0/g, ' ')} strán`;
/**
 * Kolo 36 (Samuel: animacia, ze sken prebehne strasne vela stran a my fotime len jednu): krok 1 "Naskenovat cely archiv moze byt
 * drahe.": stoh, cez ktory stale prebieha skenovacia ciara, pocitadlo stran rychlo rastie (0 -> 1 240 stran), pri "drahe" cenovka
 * EUR EUR EUR; krok 2 "Nas pristup katalogizacie archivu je hospodarnejsi.": stoh sa odsunie dolava a zbledne, vrchny list ide
 * doprava, pri "archivu" zeleny ramik a blesk (fotenie ako v C5), pri "hospodarnejsi" cenovka zbledne, zelena cenovka s jednym
 * EUR a stitok "1 strana". Nadpisy Skenovat vsetko je drahe / Len identifikacna strana.
 */
const LI_Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const ms = (frame / FPS) * 1000;
  const L0 = voAt(HOOK_CLIP, 0),
    L1 = voAt(HOOK_CLIP, 1);
  const stackIn = settle(frame, 150);
  const scanFrom = L0 + 150;
  const count = tween(frame, scanFrom, HOOK_W.drahe * 1000 + 300, easeInOut);
  const tag = pop(frame, L0 + HOOK_W.drahe * 1000 - 120, { damping: 15 });
  const split = tween(frame, L1 + 100, 650, easeInOut); // stoh dolava, list doprava
  const frameT = settle(frame, L1 + HOOK_W.archivu * 1000 - 250);
  const flash = tween(frame, L1 + HOOK_W.archivu * 1000 - 50, 420);
  const cheapAt = L1 + HOOK_W.hospodarnejsi * 1000 - 150;
  const tagOut = tween(frame, cheapAt, 350);
  const cheap = pop(frame, cheapAt + 120, { damping: 15 });
  const one = settle(frame, cheapAt + 200);
  const scanning = ms >= scanFrom && split < 0.5;
  const scanY = ((ms - scanFrom) % 520) / 520; // skenovacia ciara zhora dole, stale dokola
  const cx = 540,
    cy = 560;
  const w = 300,
    h = 400;
  const sheets = Array.from({ length: 6 }, (_, i) => i);
  const stackDx = -230 * split;
  const stackDim = 0.55 * split;
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: LI.w, height: LI.h, opacity: stackIn, transform: `translateY(${(1 - stackIn) * 20}px)` }}>
        {sheets.map((i) => {
          const top = i === 5;
          const rot = (i - 2.5) * 2.2;
          const dx = (i - 2.5) * 9,
            dy = -i * 14;
          const lx = top ? 480 * split : 0; // vrchny list ide doprava (o 480 px voci stohu, ktory ide dolava)
          const ly = top ? -40 * split : 0;
          const sc = top ? 1 + 0.1 * split : 1;
          return (
            <div key={i} style={{ position: 'absolute', left: cx - w / 2 + dx + stackDx + lx, top: cy - h / 2 + dy + ly, width: w, height: h, opacity: top ? 1 : 1 - stackDim, transform: `rotate(${rot * (1 - (top ? split : 0))}deg) scale(${sc})`, transformOrigin: 'center', filter: 'drop-shadow(0 10px 22px rgba(15,23,42,0.14))' }}>
              <Sheet w={w} h={h} lines={8} title qr={top} stamp={top} />
              {top && frameT > 0 ? (
                <div style={{ position: 'absolute', inset: -14, borderRadius: 10, border: `5px solid ${BRAND[500]}`, opacity: Math.min(1, frameT * 1.5), transform: `scale(${1.08 - 0.08 * frameT})` }} />
              ) : null}
              {top && flash > 0 && flash < 1 ? <div style={{ position: 'absolute', inset: -14, borderRadius: 10, background: '#fff', opacity: 0.9 * (1 - flash) }} /> : null}
            </div>
          );
        })}
        {/* skenovacia ciara cez stoh, stale dokola, kym sa stoh neodsunie */}
        {scanning ? (
          <div style={{ position: 'absolute', left: cx - w / 2 - 40 + stackDx, top: cy - h / 2 - 70 + scanY * (h + 60), width: w + 80, height: 6, borderRadius: 3, background: INK[500], opacity: 0.75 * (1 - split * 2), boxShadow: '0 0 18px 6px rgba(71,85,105,0.35)' }} />
        ) : null}
      </div>
      {/* pocitadlo stran pod stohom (sivo), pri odsune ostava pri stohu */}
      {count > 0 ? (
        <div style={{ position: 'absolute', left: cx - 220 + stackDx, top: 800, width: 440, textAlign: 'center', fontFamily: FONT.display, fontWeight: 800, fontSize: 48, letterSpacing: '-0.01em', color: INK[500], opacity: 1 - stackDim, whiteSpace: 'nowrap' }}>{fmtPages(HOOK_PAGES * count)}</div>
      ) : null}
      {/* stitok "1 strana" pod zdvihnutym listom */}
      {one > 0 ? (
        <div style={{ position: 'absolute', left: cx + 250 - 220, top: 800, width: 440, textAlign: 'center', fontFamily: FONT.display, fontWeight: 800, fontSize: 48, letterSpacing: '-0.01em', color: BRAND[600], opacity: one, transform: `translateY(${(1 - one) * 12}px)`, whiteSpace: 'nowrap' }}>1 strana</div>
      ) : null}
      {/* cenovka EUR EUR EUR pri "drahe"; pri "hospodarnejsi" zbledne a pri liste je zelena cenovka s jednym EUR */}
      {tag > 0 && tagOut < 1 ? (
        <div style={{ position: 'absolute', left: 690 + 1.6 * stackDx, top: 300, opacity: 1 - tagOut, transform: `rotate(8deg) scale(${1.9 * (0.7 + 0.3 * Math.min(1, tag))})`, transformOrigin: 'left center' }}>
          <PriceTag text="€€€" s={Math.min(1, tag)} size={26} />
        </div>
      ) : null}
      {cheap > 0 ? (
        <div style={{ position: 'absolute', left: 930, top: 300, opacity: Math.min(1, cheap * 1.4), transform: `rotate(8deg) scale(${1.9 * (0.7 + 0.3 * Math.min(1, cheap))})`, transformOrigin: 'left center' }}>
          <PriceTag text="€" s={Math.min(1, cheap)} color={BRAND[600]} size={26} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
/**
 * C5: scena od 300 ms (zatvorena krabica vypadla), bez pauz, od 4000 ms (zlozka, mobil, blesk, najazd na mobil) 1,4x cez mapu
 * casu; ikony polica / krabica / sanon / zlozka naraz pri "Kazda polozka", nalepky QR pri slove "kod", odidu pri vete
 * "Odfoti sa len titulna strana." (pri prichode mobilu). Mobil v F1 nadvazuje na koniec sceny (8400) ako doteraz.
 */
const C5_46_CLIP = 'K46-C5-Teren';
const C5_46_SPEED = 1.4;
/** Kolo 35: ikony a QR 1,15x. Kolo 36 (Samuel): tretia veta "Skenuje sa az to, co naozaj potrebujete." a dokumenty cez mobil vypadli,
 * po najazde na mobil scena stoji (8400) len do konca vety o identifikacnej strane, hned nasleduje aplikacia. */
const C5_46_END = voAt(C5_46_CLIP, 1) + (voLines(C5_46_CLIP)[1].dur ?? 2880) + 200;
const C5_46_MAP: [number, number][] = [
  [0, 300],
  [3200, 4000],
  [3200 + 4400 / C5_46_SPEED, 8400],
  [C5_46_END, 8400],
];
const C5_46_SECONDS = C5_46_END / 1000;
const C5_46_Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const w = mapMs(C5_46_MAP, (frame / FPS) * 1000);
  return (
    <Freeze frame={(w / 1000) * FPS}>
      <C5_Teren steps={[]} />
    </Freeze>
  );
};
const C5_46_W0 = { kod: 1.6 }; // s od zaciatku vety "Kazda polozka dostane QR kod." (words): "kod"
const C5_46_STEPS: C5Step[] = [
  { from: 300, title: 'Prilepiť QR kód' },
  { from: voAt(C5_46_CLIP, 1) - 100, title: 'Odfotiť len identifikačnú stranu' },
];
const C5Hierarchy46: React.FC = () => <C5HierarchyBase clip={C5_46_CLIP} outAt={voAt(C5_46_CLIP, 1) - 100} iconsAt={[0, 1, 2, 3].map((i) => voAt(C5_46_CLIP, 0) + 150 + i * 90)} qrAt={voAt(C5_46_CLIP, 0) + C5_46_W0.kod * 1000 - 150} arrange={false} />;
/** F24: zostrih k46-f24-review (pokoj na fotke 2,4 s, lupa 1,6x, prijatie hned), veta "Aplikacia z fotky sama vycita udaje a clovek ich len potvrdi.", klik 0,3 s po "potvrdi". */
const KF24_46 = 'k46-f24-review';
const F24_46_CLIP = 'K46-F24-Aplikacia';
const F24_46_L0 = voAt(F24_46_CLIP, 0) / 1000;
const F24_46_W = { udaje: 1.94, clovek: 2.84, potvrdi: 3.3, upravi: 4.18 }; // s od zaciatku vety "Aplikacia z fotky sama vycita udaje a clovek ich potvrdi alebo upravi." (words)
const F24_46_UDAJE = F24_46_L0 + F24_46_W.udaje;
const F24_46_POTVRDI = F24_46_L0 + F24_46_W.potvrdi;
const F24_46_TAPS: Tap[] = [tapAt(KF24_46, 12.15, 1734, 764)]; // prijat spravnu hodnotu (Nazov projektu)
const F24_46_UPRAVI = F24_46_L0 + F24_46_W.upravi;
const F24_46_END = F24_46_L0 + (voLines(F24_46_CLIP)[0].dur ?? 4960) / 1000 + 0.6; // kolo 36: 0,6 s po vete
const F24_46_MARKS: Mark[] = [
  markAt(KF24_46, F24_46_L0 + 0.3, F24_46_UDAJE - 0.05, 286, 523, 331, 443, { spot: true }), // "z fotky sama vycita": fotka
  markAt(KF24_46, F24_46_UDAJE + 0.3, F24_46_POTVRDI - 0.4, 824, 654, 428, 32, { spot: true }), // "udaje": navrhnuta hodnota
];
const F24_46_VIEWS: FootView[] = (() => {
  const photo = { x: 120, y: 360, w: 840 },
    form = { x: 700, y: 380, w: 840 },
    accept = { x: 910, y: 380, w: 840 };
  const tap = F24_46_TAPS[0].t;
  return [
    { t: 0, ...photo },
    { t: F24_46_UDAJE - 0.2, ...photo }, // "z fotky sama vycita"
    { t: F24_46_UDAJE + 0.4, ...form }, // "udaje": nazov projektu
    { t: tap - 0.9, ...form },
    { t: tap - 0.25, ...accept }, // "potvrdi": klik na fajku
    { t: tap + 99, ...accept },
  ];
})();
const F24_46_STEPS: Step[] = [
  { from: 0, title: 'Prečítať text' },
  { from: F24_46_UDAJE * 1000, title: 'Návrh údajov' },
  { from: F24_46_POTVRDI * 1000 - 150, title: 'Človek potvrdí alebo upraví' },
];
/** Kolo 34: okno zbledlo a karta sa vysunula na jeho miesto. Kolo 36 (Samuel: rychlo to preblikne, karta ma byt rovno pod oknom):
 * okno ostava, karta pod nim ako v K, pri "potvrdi" fajka, pri "upravi" ceruzka. */
const LI_F24_46: React.FC = () => <LI_F24Base src={`footage/${KF24_46}.mp4`} views={F24_46_VIEWS} taps={[]} marks={F24_46_MARKS} end={F24_46_END} L0={F24_46_L0} L01={F24_46_UDAJE} approveAt={F24_46_POTVRDI + 0.1} editAt={F24_46_UPRAVI} />;
/** F3: ten isty zostrih, len karta a cesta drzia o 1,3 s kratsie (k46-f3-search). */
const KF3_46 = 'k46-f3-search';
const F3_46_SECONDS = cutDuration(KF3_46);
const LI_F3_46: React.FC = () => <LI_F3Base src={`footage/${KF3_46}.mp4`} seconds={F3_46_SECONDS} marks={f3Marks(F3_CLIP, F3_46_SECONDS).slice(0, 1)} />; // kolo 36 (Samuel: divne sa to prekryva): karta a cesta pod oknom ako v K
/* Kolo 33 mala tu scenu Dve fazy (dve karty, LI_Fazy); v kole 34 ju nahradil hacik na zaciatku a Vysledok (tri body), kod je v commite 63756e0. */
/** C8: len slide "Prvy krok" (veta "Zacnime jednou krabicou, zadarmo a nezavazne."), prelinacka z Dve fazy. */
const C8_46_CLIP = 'K46-C8-Ponuka';
const LI_C8_46: React.FC = () => (
  <AbsoluteFill style={{ background: '#fff' }}>
    <C8FirstStep lineAt={voAt(C8_46_CLIP, 0)} /> {/* kolo 36: riadok "Na kluc, alebo vlastnymi silami" prec (bude na webe) */}
  </AbsoluteFill>
);
/**
 * Vysledok (kolo 34, namiesto LI_Fazy; bez zvuku boli dve karty textu necitatelne): tri riadky s fajkou, kazdy pri svojom
 * slove vety "Viete, co mate, kde to je a co skartovat alebo uchovat." (druha faza je v haciku).
 */
const VYS_CLIP = 'K46-Vysledok';
/** Kolo 36 (Samuel): "Vysledok katalogizacie je, ze viete, co mate, kde to je a ako s tym dalej nalozit." (tri zelene riadky pri
 * slovach) a "Na zaklade toho viete rozhodnut, napriklad co uchovat, skartovat alebo plnohodnotne skenovat." (dlazdice v obrysoch
 * od zaciatku vety, rozsvietia sa pri slovach). Casy slov z K46-Vysledok-0 a -1 words. */
const VYS_W = { co: 2.52, kde: 3.32, ako: 4.22, uchovat: 2.8, skartovat: 3.58, skenovat: 4.64 };
const VYS_L0 = voAt(VYS_CLIP, 0);
const VYS_L1 = voAt(VYS_CLIP, 1);
const VYS_SECONDS = (VYS_L1 + (voLines(VYS_CLIP)[1].dur ?? 6240)) / 1000 + 0.3;
const VYS_STEPS: Step[] = [
  { from: -9999, title: 'Výsledok katalogizácie' },
  { from: VYS_L1 - 150, title: 'Čo ďalej' },
];
const VysRow: React.FC<{ text: string; at: number; top: number; showAt?: number }> = ({ text, at, top, showAt }) => {
  const frame = useCurrentFrame();
  const t = settle(frame, showAt ?? at); // kolo 36: riadky su v obrysoch od zaciatku vety (3 s bielej pred "co mate"), zelene pri slovach
  const tick = pop(frame, at + 60);
  return (
    <div style={{ position: 'absolute', left: C8X, top, width: C8W, height: 130, boxSizing: 'border-box', borderRadius: 24, background: tick > 0.5 ? BRAND[600] : '#fff', border: `2px solid ${tick > 0.5 ? BRAND[600] : INK[200]}`, boxShadow: tick > 0.5 ? '0 14px 34px rgba(31,122,51,0.28)' : '0 12px 30px rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', gap: 30, padding: '0 40px', opacity: t, transform: `translateY(${(1 - t) * 24}px)` }}>
      {/* kolo 35 (publikum: zaber Co mate / Kde to je je vizualne chudobny): riadok sa pri fajke vyplni zelenou */}
      <div style={{ width: 76, height: 76, borderRadius: 38, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', opacity: Math.min(1, tick * 1.4), transform: `scale(${0.4 + 0.6 * tick})` }}>
        <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke={BRAND[600]} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5 L10 17 L19 7" />
        </svg>
      </div>
      <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 50, lineHeight: 1.05, letterSpacing: '-0.02em', color: tick > 0.5 ? '#fff' : INK[900] }}>{text}</div>
    </div>
  );
};
type VysKind = 'keep' | 'shred' | 'scan';
const VysIcon: React.FC<{ kind: VysKind }> = ({ kind }) => (
  <svg width={64} height={64} viewBox="0 0 24 24" fill="none" stroke={BRAND[700]} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    {kind === 'keep' ? (
      <>
        <path d="M3 7h18v3H3zM5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
        <path d="M10 14h4" />
      </>
    ) : kind === 'shred' ? (
      <>
        <path d="M7 10V4a1 1 0 0 1 1-1h6l3 3v4" />
        <path d="M4 10h16v4H4z" />
        <path d="M7 14v6M10 14v5M13 14v6M16 14v5" />
      </>
    ) : (
      <>
        <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
        <path d="M4 12h16" />
        <path d="M9 8h6M9 16h6" />
      </>
    )}
  </svg>
);
const VYS_TILES: { kind: VysKind; label: string; sub: string; at: number }[] = [
  { kind: 'keep', label: 'Uchovať', sub: 'dlhodobo', at: VYS_W.uchovat },
  { kind: 'shred', label: 'Skartovať', sub: 'menší sklad', at: VYS_W.skartovat },
  { kind: 'scan', label: 'Plnohodnotne skenovať', sub: 'fulltextové vyhľadávanie', at: VYS_W.skenovat },
];
const VysTile: React.FC<{ kind: VysKind; label: string; sub: string; at: number; showAt: number; left: number }> = ({ kind, label, sub, at, showAt, left }) => {
  const frame = useCurrentFrame();
  const t = settle(frame, showAt); // dlazdice su v obrysoch od zaciatku vety, rozsvietia sa pri slovach
  const on = pop(frame, at, { damping: 16 });
  return (
    <div style={{ position: 'absolute', left, top: 650, width: 300, height: 320, boxSizing: 'border-box', borderRadius: 26, background: '#fff', border: `3px solid ${on > 0.5 ? BRAND[500] : INK[200]}`, boxShadow: '0 12px 30px rgba(15,23,42,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '0 14px', textAlign: 'center', opacity: t * (0.55 + 0.45 * Math.min(1, on)), transform: `translateY(${(1 - t) * 24}px)` }}>
      <div style={{ width: 104, height: 104, borderRadius: 52, background: on > 0.5 ? BRAND[50] : '#fff', border: `2px solid ${on > 0.5 ? BRAND[300] : INK[200]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.8 + 0.2 * Math.min(1, on)})` }}>
        <VysIcon kind={kind} />
      </div>
      <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 36, lineHeight: 1.05, letterSpacing: '-0.02em', color: INK[900] }}>{label}</div>
      <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 25, lineHeight: 1.15, color: INK[600] }}>{sub}</div>
    </div>
  );
};
const LI_Vysledok: React.FC = () => (
  <AbsoluteFill style={{ background: '#fff' }}>
    <VysRow text="Čo máte" at={VYS_L0 + VYS_W.co * 1000 - 100} top={190} showAt={VYS_L0 + 150} />
    <VysRow text="Kde to je" at={VYS_L0 + VYS_W.kde * 1000 - 100} top={340} showAt={VYS_L0 + 240} />
    <VysRow text="Ako s tým ďalej" at={VYS_L0 + VYS_W.ako * 1000 - 100} top={490} showAt={VYS_L0 + 330} />
    {VYS_TILES.map((t, i) => (
      <VysTile key={t.kind} {...t} at={VYS_L1 + t.at * 1000 - 120} showAt={VYS_L1 - 100 + i * 90} left={C8X + i * (300 + (C8W - 900) / 2)} />
    ))}
  </AbsoluteFill>
);
const LI_LIST_46: LiDef[] = [
  { def: paced(C2_46_CLIP, { scene: LI_C2_46, seconds: C2_46.seconds, stills: [], ...noSubs }), band: true, tone: () => 'dark', shift: c2ShiftFor(C2_46_GEO), win: INTRO_WIN, overflow: true },
  { def: paced(C4_46_CLIP, { scene: K_C4_LI46, seconds: C4_46_SECONDS, stills: [], ...noSubs }), band: true, tone: (ms) => (ms < C4_LIGHT ? 'dark' : 'light'), toWhite: C4_LIGHT, toWhiteMs: 60, shift: c4ShiftFor(C2_46.seconds, C2_46_GEO.slowZoom), win: c4Win, top: C4Top46, subInk: c4SubInk, rowOut: [C4_WIPE + WIPE_MS, c4BrandOut(K_C4_H46) + 300] },
  { def: paced(HOOK_CLIP, { scene: LI_Hook, seconds: HOOK_SECONDS, stills: [], ...noSubs }), tone: () => 'light', steps: HOOK_STEPS, phase: PHASE_ARCHIV, xfadeIn: 250 },
  { def: paced(C5_46_CLIP, { scene: C5_46_Scene, seconds: C5_46_SECONDS, stills: [], ...noSubs }), band: true, tone: () => 'light', steps: C5_46_STEPS, phase: PHASE_ARCHIV, shift: c5Shift, win: { top: 138, bottom: 1030, feather: 18 }, overflow: true, overlay: C5Hierarchy46, xfadeIn: 400 },
  // kolo 34: skutocny zaznam fotenia (F1) vypadol, fotenie ukazuje hacik aj C5 (blesk), F24 sa prelinie z mobilu na konci C5
  { def: paced(F24_46_CLIP, { scene: LI_F24_46, seconds: F24_46_END, stills: [], ...noSubs }), tone: () => 'light', steps: F24_46_STEPS, phase: phases.app, xfadeIn: F1_XFADE },
  { def: paced('K-F3-Vyhladavanie', { scene: LI_F3_46, seconds: F3_46_SECONDS, stills: [], ...noSubs }), tone: () => 'light', steps: f3Steps(F3_CLIP), phase: phases.search },
  { def: paced(VYS_CLIP, { scene: LI_Vysledok, seconds: VYS_SECONDS, stills: [], ...noSubs }), tone: () => 'light', steps: VYS_STEPS, phase: offer.kicker }, // kolo 36: bez prelinacky z hladania (nic sa neprekryva)
  { def: paced(C8_46_CLIP, { scene: LI_C8_46, seconds: clipEndSeconds(C8_46_CLIP, 0.2), stills: [], ...noSubs }), tone: () => 'light', steps: [{ from: -9999, title: 'Prvý krok' }], phase: offer.kicker, subsOut: [0, 1e9], xfadeIn: C8_XFADE },
  { def: paced('K-C9-Outro', { scene: LI_C9, seconds: 1.8, stills: [], ...noSubs }), tone: () => 'dark', chrome: false, subs: false },
];
export const liFrames46 = () => liFramesOf(LI_LIST_46);
export const liStarts46 = () => liStartsOf(LI_LIST_46);
export const K_LinkedIn46 = filmOf(LI_LIST_46);
/** Pre skripty: kedy su v K46 zlozky hore (ms klipu C2), aby `at` vety o hodinach v vo_kratka.json sedelo (upAt - 100). */
export const k46Info = () => ({ c2UpAt: C2_46_GEO.upAt, c2WalkMs: C2_46_GEO.walkMs });
