import React from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion';
import { FOOTAGE_PHONE, PHONE_BEZEL, PhoneFrame } from '../components/Device';
import { settle, tween } from '../lib/anim';
import { loadFonts } from '../lib/fonts';
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
export const F1_SECONDS = 10.8; // drz v sulade so scenesList.ts (cakanie a mierenie 1,5x, nahravanie 5x)
const SRC_W = 884,
  SRC_H = 1920;

export type Tap = { t: number; x: number; y: number }; // s, podiel sirky/vysky celeho zaznamu
export type Step = { from: number; title: string; line: string }; // s

const F1_TAPS: Tap[] = [
  { t: 1.07, x: 0.94, y: 0.79 }, // Dalej
  { t: 3.37, x: 0.5, y: 0.36 }, // Skenovat QR z prilohy
  { t: 3.82, x: 0.94, y: 0.79 }, // Dalej
  { t: 5.57, x: 0.5, y: 0.32 }, // Odfotit/nahrat fotografiu
  { t: 7.4, x: 0.5, y: 0.85 }, // spust
  { t: 8.45, x: 0.9, y: 0.92 }, // Use Photo
  { t: 9.65, x: 0.9, y: 0.79 }, // Vytvorit
];
const F1_STEPS: Step[] = [
  { from: 0, title: 'Typ jednotky', line: 'Zložka pod krabicou KR_01.' },
  { from: 1.22, title: 'Priradiť QR', line: 'Kód sa prečíta z fotky štítku.' },
  { from: 3.97, title: 'Odfotiť štítok', line: 'Fotka je dôkaz. Appka z nej číta údaje.' },
  { from: 8.45, title: 'Skontrolovať a vytvoriť', line: 'Jednotka má ID a svoje miesto.' },
];

const PHONE = FOOTAGE_PHONE;
/** Orez zaznamu (namerane na f1-sken.mp4): stavova lista iOS 0-115 px, lista Safari od 1743 px z 1920. */
const CROP = { top: 115 / 1920, bottom: 177 / 1920 };

export const FootageClip: React.FC<{ src: string; seconds: number; taps?: Tap[]; steps?: Step[]; crop?: { top: number; bottom: number } }> = ({ src, seconds, taps = [], steps = [], crop = CROP }) => {
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
      <PhoneFrame at={PHONE}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#fff' }}>
          {/* footage orezane o systemove listy: video sirsie o crop, posunute hore */}
          <div style={{ position: 'absolute', left: videoLeft, top: -crop.top * videoH, width: videoW, height: videoH }}>
            <OffthreadVideo src={file} muted style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
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

      {/* sprievodny text vpravo */}
      <div style={{ position: 'absolute', left: 960, top: 0, width: 800, height: 1080, display: 'flex', flexDirection: 'column', justifyContent: 'center', opacity: textIn, transform: `translateX(${(1 - textIn) * 40}px)` }}>
        {steps.map((s, i) => {
          const on = i === stepIdx ? 1 : 0;
          const inT = settle(frame, s.from * 1000);
          return (
            <div key={i} style={{ position: 'absolute', left: 0, right: 0, opacity: on * inT, transform: `translateY(${(1 - inT) * 16}px)` }}>
              <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 24, letterSpacing: '0.14em', textTransform: 'uppercase', color: BRAND[600], marginBottom: 18 }}>
                Krok {i + 1} / {steps.length}
              </div>
              <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 64, lineHeight: 1.05, color: INK[900], letterSpacing: '-0.02em', marginBottom: 18 }}>{s.title}</div>
              <div style={{ fontFamily: FONT.body, fontWeight: 400, fontSize: 34, lineHeight: 1.35, color: INK[500], maxWidth: 640 }}>{s.line}</div>
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

export const F1_Sken: React.FC = () => <FootageClip src={F1_SRC} seconds={F1_SECONDS} taps={F1_TAPS} steps={F1_STEPS} />;
