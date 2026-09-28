import React from 'react';
import { C4_Cena } from '../C4_Cena';
import { C5Step } from '../C5_Teren';
import { Tap as PhoneTap } from '../F1_Sken';
import { Mark, Tap, markAt, tapAt } from '../F2_Metadata';
import { Step } from '../../components/Steps';
import { voAt } from '../../components/Subtitles';
import { cutDuration, cutTime, segStart } from '../../lib/cuts';

/**
 * Experiment kratkej verzie: spolocne data pre LinkedIn 4:5 (LinkedIn.tsx), jedinu kratku verziu (kolo 2). Scény hlavnej
 * verzie bez zmeny ich predvoleneho spravania; hlas a titulky su v src/copy/vo_kratka.json (klipy K-*), zostrihy
 * footage k-* v src/footage/cuts.json. Kolo 3: klipy 16:9 (K-C2 ... K-C9, K-Full) vypadli, novy hlas by im nesedel.
 */

/**
 * Kolo 3 (Samuel): jednoduchsi slogan namiesto "Digitalna katalogizacia archivovanej dokumentacie" (laikom znie uradnicky);
 * rovnaky pod logom v C4 aj na zaverecnom logu.
 */
export const SLOGAN = 'Digitálny poriadok v papierovom archíve';
/**
 * C4 v kratkej verzii: predel skor (d 600 ms namiesto 1300), znacka drzi pocas vety o katalogu. Kolo 4: bez lockupu
 * assetin.space z C4 (Samuel: zatial bez .space), logo kresli ramec LinkedIn (domcek, assetin | Archives).
 */
export const K_C4_D = 600;
export const K_C4_H = 3300;
export const K_C4: React.FC = () => <C4_Cena d={K_C4_D} h={K_C4_H} brand={false} />;
/** Scena C4 konci po usadeni krabice a paticke (ako v hlavnej verzii: 8200 + d + h + 900 ms). */
export const c4End = (d: number, h: number) => (8200 + d + h + 900) / 1000;

/** Nazov fazy pre pracu so skutocnymi krabicami: "V terene" divakom v teste evokovalo stavbu, "V archive" je jasne. */
export const PHASE_ARCHIV = 'V archíve';

/** C5: dva kroky podla jednej vety (QR na krabicu aj zlozky, fotka titulnej strany). */
export const C5_STEPS = (clip: string): C5Step[] => [
  { from: 600, title: 'Prilepiť QR kód' },
  { from: voAt(clip, 0, 1), title: 'Odfotiť titulnú stranu' },
];

/** F1: skutocny fotoaparat v aplikacii (spust), bez hlasu; obrazovka s vyvojarskym textom aj nahlad fotky vypadli. */
export const KF1 = 'k-f1-sken';
export const K_F1_SECONDS = cutDuration(KF1);
export const K_F1_TAPS: PhoneTap[] = [
  { t: cutTime(KF1, 8.9), x: 0.5, y: 0.824 }, // spust (kolo 4: zaznam konci pred nahladom fotky, Use Photo vypadlo)
];

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
/** Popis karty softveru (LinkedIn C8). */
export const SOFTWARE_DESC = 'Spracujete sami v našej aplikácii.';
