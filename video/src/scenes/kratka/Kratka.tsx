import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C4_Cena } from '../C4_Cena';
import { C5_Teren, C5Step } from '../C5_Teren';
import { C9_Outro } from '../C9_Outro';
import { Card, Kicker, LEFT, RIGHT } from '../C8_Pilot';
import { FootageClip, Step as PhoneStep, Tap as PhoneTap } from '../F1_Sken';
import { DesktopFootageClip, Mark, Tap, ZoomKey, markAt, tapAt } from '../F2_Metadata';
import { Scene } from '../../components/Scene';
import { Step } from '../../components/Steps';
import { FOOTAGE_WINDOW_WIDE } from '../../components/Device';
import { voAt } from '../../components/Subtitles';
import { cutDuration, cutTime, segStart } from '../../lib/cuts';
import { pop, settle, tween } from '../../lib/anim';
import { offer, phases } from '../../copy/sk';

/**
 * Experiment kratkej verzie (~74 s). Pouziva scény hlavnej verzie (C2, C4, C5, C8, C9, footage) bez zmeny ich
 * predvoleneho spravania; hlas a titulky su v src/copy/vo_kratka.json (klipy K-*), zostrihy footage k-* v
 * src/footage/cuts.json. Poradie: C2 · C4 · C5 · F1 · F24 (navrh + kontrola) · F3 · C8 · C9. Bez intra: hacik hned.
 * Kolo 2 (Samuel): teaser vypadol, jedina kratka verzia je LinkedIn 4:5 (LinkedIn.tsx), tieto scény 16:9 su jej zaklad.
 */

/** C4 v kratkej verzii: predel skor (d 600 ms namiesto 1300), znacka drzi pocas vety o katalogu. */
export const K_C4_D = 600;
export const K_C4_H = 3300;
export const K_C4: React.FC = () => <C4_Cena d={K_C4_D} h={K_C4_H} />;
/** Scena C4 konci po usadeni krabice a paticke (ako v hlavnej verzii: 8200 + d + h + 900 ms). */
export const c4End = (d: number, h: number) => (8200 + d + h + 900) / 1000;

/** Nazov fazy pre pracu so skutocnymi krabicami: "V terene" divakom v teste evokovalo stavbu, "V archive" je jasne. */
export const PHASE_ARCHIV = 'V archíve';

/** C5: dva kroky podla jednej vety (QR na krabicu aj zlozky, fotka titulnej strany). */
export const C5_STEPS = (clip: string): C5Step[] => [
  { from: 600, title: 'Prilepiť QR kód' },
  { from: voAt(clip, 0, 1), title: 'Odfotiť titulnú stranu' },
];
export const K_C5: React.FC = () => <C5_Teren steps={C5_STEPS('K-C5-Teren')} phase={PHASE_ARCHIV} />;

/** F1: skutocny fotoaparat v aplikacii (spust, Use Photo), bez hlasu; obrazovka s vyvojarskym textom vypadla. */
export const KF1 = 'k-f1-sken';
export const K_F1_SECONDS = cutDuration(KF1);
export const K_F1_TAPS: PhoneTap[] = [
  { t: cutTime(KF1, 8.9), x: 0.5, y: 0.824 }, // spust
  { t: cutTime(KF1, 9.9), x: 0.86, y: 0.916 }, // Use Photo
];
const K_F1_STEPS: PhoneStep[] = [{ from: 0, title: 'Odfotiť titulnú stranu' }];
export const K_F1: React.FC = () => <FootageClip src="footage/k-f1-sken.mp4" seconds={K_F1_SECONDS} taps={K_F1_TAPS} steps={K_F1_STEPS} phase={PHASE_ARCHIV} />;

/**
 * F24: navrh udajov a kontrola clovekom v jednom okne (namiesto C6, F2 a F4). Fotka a navrhy v pokoji,
 * lupa nad fotkou (overi), prijatie spravnej hodnoty (potvrdi), fotka ako dokaz.
 */
export const KF24 = 'k-f24-review';
export const K_F24_SECONDS = cutDuration(KF24);
const kv = (i: number, k = 0) => voAt('K-F24-Aplikacia', i, k);
export const K_F24_STEPS: Step[] = [
  { from: 0, title: 'Prečítať text' },
  { from: kv(0, 1), title: 'Návrh údajov' },
  { from: kv(1), title: 'Overiť a potvrdiť' },
  { from: kv(1, 1), title: 'Fotka je dôkaz' },
];
export const K_F24_TAPS: Tap[] = [tapAt(KF24, 12.15, 1734, 764)]; // prijat spravnu hodnotu (Nazov projektu)
const spot = { spot: true };
export const K_F24_MARKS: Mark[] = [
  markAt(KF24, kv(0) / 1000 + 0.9, kv(0, 1) / 1000 - 0.05, 286, 523, 331, 443, spot), // "z fotky sama precita text": fotka
  markAt(KF24, kv(0, 1) / 1000 + 0.5, segStart(KF24, 1) - 0.05, 824, 654, 428, 32, spot), // "navrhne udaje: nazov projektu": navrhnuta hodnota
  markAt(KF24, kv(1, 1) / 1000, K_F24_SECONDS - 0.45, 286, 523, 331, 443, spot), // "Fotka je dokaz": fotka pri zazname
];
/**
 * Priblizenie (vsetci styria simulovani divaci: obrazovka aplikacie je drobna): fotka a navrh 1,5x, pred prijatim
 * posun k tlacidlu, pri vete o fotke spat k fotke. Podiely obsahu: fotka x 0,11-0,29, hodnota x 0,41-0,65, tlacidlo x 0,93.
 */
const K_F24_ZOOM: ZoomKey[] = [
  { t: 0, x: 0.5, y: 0.5, s: 1 },
  { t: 1.0, x: 0.5, y: 0.5, s: 1 },
  { t: 1.9, x: 0.38, y: 0.62, s: 1.5 },
  { t: 9.0, x: 0.38, y: 0.62, s: 1.5 },
  { t: 9.55, x: 0.64, y: 0.62, s: 1.5 },
  { t: 10.3, x: 0.64, y: 0.62, s: 1.5 },
  { t: 11.0, x: 0.38, y: 0.62, s: 1.5 },
];
export const K_F24: React.FC = () => (
  <DesktopFootageClip src="footage/k-f24-review.mp4" seconds={K_F24_SECONDS} steps={K_F24_STEPS} taps={K_F24_TAPS} marks={K_F24_MARKS} win={FOOTAGE_WINDOW_WIDE} panelLeft={1460} panelWidth={430} enter zoom={K_F24_ZOOM} />
);

/** F3: slovo, vysledok a cesta PL_01 / KR_01 / ZL_03 (polica, krabica, zlozka); rovnaky zostrih v K aj T. */
export const KF3 = 'k-f3-search';
export const K_F3_SECONDS = cutDuration(KF3);
/** F3: kroky a zvyraznenia podla vety klipu (16:9 aj LinkedIn). */
export const f3Steps = (clip: string): Step[] => [
  { from: 0, title: 'Napísať slovo' },
  { from: voAt(clip, 0, 1), title: 'Polica a krabica' },
];
export const f3Marks = (clip: string): Mark[] => {
  const v = (k: number) => voAt(clip, 0, k);
  return [
    markAt(KF3, v(0) / 1000 + 0.3, segStart(KF3, 1) + 0.1, 190, 578, 1638, 62, spot), // pole vyhladavania (pisanie slova)
    markAt(KF3, v(1) / 1000 + 1.0, K_F3_SECONDS - 0.45, 596, 783, 246, 28, spot), // PL_01 / KR_01 / ZL_03: "na ktorej polici a v ktorej krabici"
  ];
};
const F3Short: React.FC<{ clip: string }> = ({ clip }) => {
  // priblizenie 1,5x na lavu cast: pole s napisanym slovom, vysledok a cesta PL_01 / KR_01 / ZL_03
  const zoom: ZoomKey[] = [
    { t: 0, x: 0.5, y: 0.5, s: 1 },
    { t: 0.5, x: 0.5, y: 0.5, s: 1 },
    { t: 1.3, x: 0.35, y: 0.55, s: 1.5 },
  ];
  return <DesktopFootageClip src="footage/k-f3-search.mp4" seconds={K_F3_SECONDS} steps={f3Steps(clip)} phase={phases.search} marks={f3Marks(clip)} win={FOOTAGE_WINDOW_WIDE} panelLeft={1460} panelWidth={430} enter zoom={zoom} />;
};
export const K_F3: React.FC = () => <F3Short clip="K-F3-Vyhladavanie" />;

/** C8 v kratkej verzii: jeden riadok (sluzba na kluc, softver), riadok rozsahu nasadenia vypadol. */
const ROW = { kicker: 330, top: 374 }; // stred bloku na strede plochy nad titulkami (ako kolo 47)
export const SOFTWARE_DESC = 'Spracujete sami v našej aplikácii.';
export const K_C8: React.FC = () => {
  const frame = useCurrentFrame();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const soft = voAt('K-C8-Ponuka', 1);
  const dimService = 0.45 * tw(soft + 100, 400) * (1 - tw(soft + 2500, 400)); // pocas vety o softveri je sluzba stlmena
  return (
    <Scene mode="light" footer>
      <Kicker y={ROW.kicker} t={settle(frame, 200)} text={offer.kicker} />
      <Card x={LEFT} y={ROW.top} t={settle(frame, 400)} dim={dimService} main icon="box" title={offer.service.title} desc={offer.service.desc} step={offer.service.step} stepT={pop(frame, voAt('K-C8-Ponuka', 0, 1) + 250)} />
      <Card x={RIGHT} y={ROW.top} t={settle(frame, soft)} dim={0} icon="app" title={offer.software.title} desc={SOFTWARE_DESC} step={offer.software.step} stepT={pop(frame, soft + 1700)} />
    </Scene>
  );
};

/** C9 s vyzvou (divaci v teste postradali, co maju urobit). */
export const CTA = 'Dohodnite si obhliadku';
export const K_C9: React.FC = () => <C9_Outro cta={CTA} />;
