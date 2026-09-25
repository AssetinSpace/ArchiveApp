import React from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion';
import { FOOTAGE_PHONE, PHONE_BEZEL, PhoneFrame } from '../components/Device';
import { settle, tween } from '../lib/anim';
import { loadFonts } from '../lib/fonts';
import { phases } from '../copy/sk';
import { cutDuration, cutTime } from '../lib/cuts';
import { voAt } from '../components/Subtitles';
import { BRAND, FONT, INK } from '../theme';

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

export type Tap = { t: number; x: number; y: number }; // s, podiel sirky/vysky celeho zaznamu
export type Step = { from: number; title: string; line?: string }; // s
/** Zvyraznenie ako fixkou (kolo 33): s, podiely celeho zaznamu, sweep = s kreslenia zlava. */
export type PhoneMark = { from: number; to: number; x: number; y: number; w: number; h: number; sweep?: number };

/** Kolo 33: kliky premerane na zazname 1206 x 2622 (podiely), casy zdroja. */
const F1_TAPS: Tap[] = [
  { t: cutTime('f1-sken', 0.22), x: 0.5, y: 0.385 }, // Pridat do tejto jednotky (KR_01)
  { t: cutTime('f1-sken', 1.7), x: 0.887, y: 0.791 }, // Dalej
  { t: cutTime('f1-sken', 8.9), x: 0.5, y: 0.824 }, // spust
  { t: cutTime('f1-sken', 9.9), x: 0.86, y: 0.916 }, // Use Photo
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
  const stepIdx = Math.max(0, steps.findIndex((s, i) => ms / 1000 >= s.from && (i === steps.length - 1 || ms / 1000 < steps[i + 1].from)));

  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      {panelOnly ? null : (
      <PhoneFrame at={PHONE}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#fff' }}>
          {/* footage orezane o systemove listy: video sirsie o crop, posunute hore */}
          <div style={{ position: 'absolute', left: videoLeft, top: -crop.top * videoH, width: videoW, height: videoH }}>
            <OffthreadVideo src={file} muted style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
            {marks.map((m, i) => {
              const a = tw(m.from * 1000, 200) * (1 - tw(m.to * 1000 - 250, 250));
              if (a <= 0) return null;
              const sweep = m.sweep ? tw(m.from * 1000, m.sweep * 1000) : 1;
              return <div key={`m${i}`} style={{ position: 'absolute', left: m.x * videoW - 4, top: m.y * videoH, width: (m.w * videoW + 8) * sweep, height: m.h * videoH, borderRadius: 4, background: 'rgba(79,168,90,0.28)', opacity: a, mixBlendMode: 'multiply' }} />;
            })}
            {/* tapy: jemny zeleny kruh, ktory sa rozsiri a zmizne */}
            {taps.map((tp, i) => {
              const t = tw(tp.t * 1000, 550);
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

      {/* sprievodny text vpravo */}
      <div style={{ position: 'absolute', left: 960, top: 0, width: 800, height: 1080, display: 'flex', flexDirection: 'column', justifyContent: 'center', opacity: textIn, transform: `translateX(${(1 - textIn) * 40}px)` }}>
        {steps.map((s, i) => {
          const on = i === stepIdx ? 1 : 0;
          const inT = settle(frame, s.from * 1000);
          return (
            <div key={i} style={{ position: 'absolute', left: 0, right: 0, opacity: on * inT, transform: `translateY(${(1 - inT) * 16}px)` }}>
              <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 24, letterSpacing: '0.14em', textTransform: 'uppercase', color: BRAND[600], marginBottom: 18 }}>
                {phases.teren}
              </div>
              <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 64, lineHeight: 1.05, color: INK[900], letterSpacing: '-0.02em', marginBottom: 18 }}>{s.title}</div>
              {s.line ? <div style={{ fontFamily: FONT.body, fontWeight: 400, fontSize: 34, lineHeight: 1.35, color: INK[500], maxWidth: 640 }}>{s.line}</div> : null}
              {/* body krokov */}
              <div style={{ display: 'flex', gap: 10, marginTop: 36 }}>
                {steps.map((_, k) => (
                  <div key={k} style={{ width: k <= i ? 34 : 12, height: 12, borderRadius: 6, background: k <= i ? BRAND[500] : INK[200] }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

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
