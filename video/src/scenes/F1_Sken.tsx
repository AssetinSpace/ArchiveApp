import React from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion';
import { FOOTAGE_PHONE, PHONE_BEZEL, PhoneFrame } from '../components/Device';
import { settle, tween } from '../lib/anim';
import { loadFonts } from '../lib/fonts';
import { phases } from '../copy/sk';
import { cutDuration, cutTime } from '../lib/cuts';
import { voAt } from '../components/Subtitles';
import { BRAND } from '../theme';
import { StepLabel } from '../components/Frame16';
import { C5_TITLE_LEFT } from './C5_Teren';

/**
 * F1 - Footage: sken prveho stitku v appke (screen recording z mobilu).
 * Nadvazuje na koniec C5: mobil uz stoji vlavo v tom istom ramiku (C5 ho tam
 * doviedol v skutocnej velkosti), displej sa z bielej prelinackou zmeni na
 * zaznam; vpravo sprievodny text po krokoch; jemne "tapy" na tlacidlach; na konci fade do bielej (C6).
 * Footage je orezane o stavovu listu iOS a listu Safari (len appka).
 * Zdroj: public/footage/f1-sken.mp4 (priecinok nie je v gite).
 */
export const F1_SRC = 'footage/f1-sken.mp4';
export const F1_SECONDS = cutDuration('f1-sken'); // zostrih podla src/footage/cuts.json (kolo 29: pauza pred kazdym krokom, fotenie ~1x)
const SRC_W = 884,
  SRC_H = 1920;

export type Tap = { t: number; x: number; y: number; d?: number }; // s, podiel sirky/vysky celeho zaznamu; d = trvanie kruzku (ms, predvolene 550)
export type Step = { from: number; title: string; line?: string }; // s
/** Zvyraznenie (kolo 33 fixka, kolo 36 spot: ramik + stmavene okolie): s, podiely celeho zaznamu; sweep sa uz nepouziva. */
export type PhoneMark = { from: number; to: number; x: number; y: number; w: number; h: number; sweep?: number };

/**
 * Kolo 33: kliky premerane na zazname 1206 x 2622 (podiely), casy zdroja.
 * Kolo 53 (Samuel: dotyky na displeji su mimo): kruzok kliku presiel cez prelinacku do dalsej obrazovky (Dalej 1,7 s je
 * az po zaciatku prelinacky do fotoaparatu, Use Photo 9,9 s uz na formulari) a spust bola o 0,35 s neskor ako bliknutie
 * iOS (8,583 s zdroja, ako v kratkej verzii kolo 23). Kruzky su teraz na obrazovke, ktorej patria, a skoncia pred strihom;
 * Use Photo bez kruzku (tlacidlo nie je v orezanom displeji vidiet).
 */
const F1_TAPS: Tap[] = [
  { t: cutTime('f1-sken', 1.15), x: 0.887, y: 0.791, d: 420 }, // Dalej (prelinacka do fotoaparatu od 1,46 s zdroja)
  { t: cutTime('f1-sken', 8.55), x: 0.5, y: 0.824 }, // spust (bliknutie iOS 8,583 s)
  // Use Photo (9,9 s) bez kruzku: tlacidlo je pod orezom displeja (lista Safari), kruzok bol na prazdnom mieste
];
/** Kroky podla hlasu (casti vety vo vo.json): typ, zaradenie do hierarchie, fotka, zaznam. */
const voS = (k: number) => voAt('F1-Sken', 0, k) / 1000;
const F1_STEPS: Step[] = [
  { from: 0, title: 'Vybrať typ položky' },
  { from: voS(2), title: 'Zaradiť do hierarchie' },
  { from: voS(3), title: 'Odfotiť identifikačnú stranu' },
  { from: voS(4), title: 'Digitálny záznam' },
];
const F1_MARKS: PhoneMark[] = [
  { from: voS(1) + 0.2, to: voS(2), x: 0.09, y: 0.299, w: 0.25, h: 0.027, sweep: 0.5 }, // Zlozka (ZL): "ako napriklad zlozka alebo dokument"
  { from: voS(2) + 0.2, to: voS(3) - 0.3, x: 0.058, y: 0.101, w: 0.675, h: 0.031, sweep: 0.7 }, // Pridava sa jednotka pod KR_01: "zaradime ju do hierarchie"
];

const PHONE = FOOTAGE_PHONE;
/** Orez zaznamu (namerane na f1-sken.mp4): stavova lista iOS 0-115 px, lista Safari od 1743 px z 1920. */
const CROP = { top: 115 / 1920, bottom: 177 / 1920 };

export const FootageClip: React.FC<{ src: string; seconds: number; taps?: Tap[]; steps?: Step[]; marks?: PhoneMark[]; crop?: { top: number; bottom: number }; panelOnly?: boolean }> = ({ src, seconds, taps = [], steps = [], marks = [], crop = CROP, panelOnly = false }) => {
  const frame = useCurrentFrame();
  const ms = (frame / 30) * 1000;
  const tw = (s: number, d: number) => tween(frame, s, d);
  const screenIn = tw(0, 300); // displej: z bielej (koniec C5) do zaznamu
  const fadeOut = tw(seconds * 1000 - 500, 400);
  const textIn = settle(frame, 300);
  const file = staticFile(src);

  React.useEffect(() => {
    loadFonts();
  }, []);
  // displej mobilu (rovnake odvodenie ako v PhoneFrame: bezel 7 %); pocas "enter"
  // sa displej zmensuje z celeho framu, footage sa skaluje s nim (na vysku displeja)
  // displej mobilu (rovnake odvodenie ako v PhoneFrame); zaznam sa skaluje na sirku displeja,
  // orezany o systemove listy - pomer ramika je zvoleny tak, aby appka vyplnila displej presne
  const screenW = PHONE.w * (1 - 2 * PHONE_BEZEL);
  const videoW = screenW;
  const videoH = (videoW * SRC_H) / SRC_W;
  const videoLeft = 0;

  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      {panelOnly ? null : (
      <PhoneFrame at={PHONE} screenBg="#000">{/* kolo 50: cierne pozadie displeja (bez bielych rohov), ako v kratkej */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#fff' }}>
          {/* footage orezane o systemove listy: video sirsie o crop, posunute hore */}
          <div style={{ position: 'absolute', left: videoLeft, top: -crop.top * videoH, width: videoW, height: videoH }}>
            <OffthreadVideo src={file} muted style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
            {marks.map((m, i) => {
              const a = tw(m.from * 1000, 200) * (1 - tw(m.to * 1000 - 250, 250));
              if (a <= 0) return null;
              // kolo 36: spot ako v F3/F4 (zeleny ramik, stmavene okolie displeja) namiesto fixky
              return <div key={`m${i}`} style={{ position: 'absolute', left: m.x * videoW - 6, top: m.y * videoH - 5, width: m.w * videoW + 12, height: m.h * videoH + 10, borderRadius: 8, border: `3px solid ${BRAND[400]}`, boxShadow: `0 0 0 4000px rgba(15,23,42,${0.38 * a})`, opacity: Math.min(1, a * 1.5), transform: `scale(${1.02 - 0.02 * a})` }} />;
            })}
            {/* tapy: jemny zeleny kruh, ktory sa rozsiri a zmizne */}
            {taps.map((tp, i) => {
              const t = tw(tp.t * 1000, tp.d ?? 550);
              if (t <= 0 || t >= 1) return null;
              const r = 18 + 70 * t;
              return (
                <div key={i} style={{ position: 'absolute', left: tp.x * videoW - r, top: tp.y * videoH - r, width: 2 * r, height: 2 * r, borderRadius: '50%', border: `3px solid ${BRAND[400]}`, background: `rgba(79,168,90,${0.28 * (1 - t)})`, opacity: 1 - t * t }} />
              );
            })}
          </div>
          <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 1 - screenIn, pointerEvents: 'none' }} />
        </div>
      </PhoneFrame>
      )}

      {/* kolo 50: nadpis kroku hore nad stlpcom titulkov (StepLabel, ako v celom filme), bez nazvu fazy a bodiek */}
      <StepLabel frame={frame} steps={steps.map((s) => ({ from: s.from * 1000, title: s.title }))} left={C5_TITLE_LEFT} opacity={textIn} />

      <AbsoluteFill style={{ background: '#fff', opacity: fadeOut, pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};

export const F1_Sken: React.FC = () => <FootageClip src={F1_SRC} seconds={F1_SECONDS} taps={F1_TAPS} steps={F1_STEPS} marks={F1_MARKS} />;

/**
 * Nahradna verzia bez zdrojoveho footage (public/footage/f1-sken.mp4 nie je k dispozicii):
 * pod spodom je starsi render klipu (public/footage/f1-old.mp4 = out/mp4/F1-Sken.mp4 z kola 27/28),
 * nanovo sa kresli len panel s krokmi vpravo (od x 880). Po nahrati footage prepnut v scenesList na F1_Sken.
 */
export const F1_SkenPatched: React.FC = () => (
  <AbsoluteFill style={{ background: '#fff' }}>
    <OffthreadVideo src={staticFile('footage/f1-old.mp4')} muted />
    <AbsoluteFill style={{ clipPath: 'inset(0 0 0 880px)' }}>
      <FootageClip src={F1_SRC} seconds={F1_SECONDS} steps={F1_STEPS} panelOnly />
    </AbsoluteFill>
  </AbsoluteFill>
);
