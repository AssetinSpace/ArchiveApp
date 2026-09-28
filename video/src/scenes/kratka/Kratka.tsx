import React from 'react';
import { C4_Cena } from '../C4_Cena';
import { C5Step } from '../C5_Teren';
import { Tap as PhoneTap } from '../F1_Sken';
import { Mark, Tap, markAt, tapAt } from '../F2_Metadata';
import { Step } from '../../components/Steps';
import type { Hold } from '../../components/Paced';
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
 * C4 v kratkej verzii: znacka drzi pocas vety o katalogu (h). Kolo 4: bez lockupu assetin.space z C4 (Samuel: zatial
 * bez .space), logo kresli ramec LinkedIn (domcek, assetin | Archives). Kolo 5 (Samuel: dvojite platenie netreba, staci
 * ze sa dokumenty nedaju dohladat): z problemu ostava regal, otaznik a hodiny ("Hladanie trva hodiny."), predel hned
 * po hodinach (d -2200 ms: 3400 ms sceny namiesto 6200), vykres, cenovky a "2x EUR" vypadli.
 */
/**
 * Kolo 6 (Samuel: "Hladanie moze trvat hodiny.", menej prazdneho miesta): predel 3680 ms sceny (d -1920), LinkedIn
 * prehra zaciatok C4 rychlejsie (o 1150 ms), predel je tak 2530 ms klipu pod zelenym prechodom (od 2050 ms, plna
 * kapela 0,15 s pred nim); znacka drzi h 3320, aby logo odislo 5,4 s po zaciatku vety "Predstavujeme vam..." ako v kole 5.
 */
export const K_C4_D = -1920;
export const K_C4_H = 3320;
export const K_C4: React.FC = () => <C4_Cena d={K_C4_D} h={K_C4_H} brand={false} cost={false} />;
/** Scena C4 konci po usadeni krabice a paticke (ako v hlavnej verzii: 8200 + d + h + 900 ms). */
export const c4End = (d: number, h: number) => (8200 + d + h + 900) / 1000;

/** Nazov fazy pre pracu so skutocnymi krabicami: "V terene" divakom v teste evokovalo stavbu, "V archive" je jasne. */
export const PHASE_ARCHIV = 'V archíve';

/** C5: dva kroky (QR na krabicu aj zlozky, fotka titulnej strany). Kolo 8: veta o foteni je samostatna (pauza pred nou). */
export const C5_STEPS = (clip: string): C5Step[] => [
  { from: 600, title: 'Prilepiť QR kód' },
  { from: voAt(clip, 1), title: 'Odfotiť titulnú stranu' },
];
/**
 * Kolo 7 (Samuel: QR dostane kazda polozka, nie je to pevne dane): dlhsia prva veta, scena C5 stoji po dopade poslednej
 * nalepky (ako hlavna verzia v kole 32), kym zaznie "Mobilom potom odfotime..." a pride mobil.
 */
export const K_C5_HOLDS: Hold[] = [
  { at: 2300, hold: 700 }, // kolo 8: nalepka na krabici pri slove "krabica", veko sa otvori pri "sanon"
  { at: 4000, hold: 4150 }, // po dopade poslednej nalepky (pri "zlozka"), pred vytiahnutim zlozky a mobilom (4100, 4300)
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
  { from: voAt(clip, 0, 1), title: 'Údaje o položke' }, // kolo 7 (Samuel): "aplikacia ukaze udaje o konkretnej polozke aj cestu k nej"
  { from: voAt(clip, 0, 2), title: 'Cesta k položke' },
];
export const f3Marks = (clip: string): Mark[] => {
  const v = (k: number) => voAt(clip, 0, k);
  return [
    markAt(KF3, v(0) / 1000 + 0.3, segStart(KF3, 1) + 0.1, 190, 578, 1638, 62, spot), // pole vyhladavania (pisanie slova)
    markAt(KF3, v(1) / 1000 + 0.9, v(2) / 1000 + 0.1, 132, 830, 402, 180, spot), // vysledok ZL_03 (Zlozka, najdene v metadatach a OCR): "udaje o konkretnej polozke"
    markAt(KF3, v(2) / 1000 + 0.1, K_F3_SECONDS - 0.45, 596, 783, 246, 28, spot), // PL_01 / KR_01 / ZL_03: "aj cestu k nej"
  ];
};
/** Popis karty softveru (LinkedIn C8). */
export const SOFTWARE_DESC = 'Spracujete sami v našej aplikácii.';
