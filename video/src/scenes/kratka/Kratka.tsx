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
 * Kolo 9 (Samuel: hodiny jemne skratit): predel o 0,1 s skor (d -2020, zeleny prechod od 1950 ms), veta
 * "Predstavujeme vam..." tiez o 0,1 s skor (2650 ms), h ostava 3320.
 */
/** Kolo 11 (Samuel: otaznik a hodiny naraz): LinkedIn preskoci zaciatok C4 o 1700 ms (predtym 1150), d o 550 ms vyssie,
 * aby zeleny prechod ostal v 1950 ms klipu a vsetko po hodinach v rovnakom case.
 * Kolo 12 (Samuel: 0:07-0:10 je teraz rozsekane): bez skoku casu, hodiny su hned za otaznikom cez `clockAt` (1400 ms sceny
 * namiesto 2600), LinkedIn preskoci len 600 ms (kamera 1,55x ako v kole 10), d -2570 (d - preskok ostava -3170). */
export const K_C4_D = -2250; // kolo 13: predel sceny o 320 ms neskor pod pomalsim zelenym prechodom (800 ms), h o 320 ms kratsie
/** Kolo 15: C4 zacina zelenym prechodom a mostom (LinkedIn preskoci zaciatok sceny az po predel), logo odide ako v kole 14
 * 5,35 s po zaciatku vety "Predstavujeme vam...", ktora je o 2,55 s klipu (h = 4850). */
export const K_C4_H = 4850;
export const K_C4_CLOCK = 1400;
/** Kolo 33 (K46): scena C4 s inym `h` (kratsia veta pri logu). */
export const K_C4For = (h: number, withBox = true): React.FC => () => <C4_Cena d={K_C4_D} h={h} brand={false} cost={false} clockAt={K_C4_CLOCK} withBox={withBox} />;
export const K_C4 = K_C4For(K_C4_H);
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
  // spust (kolo 4: zaznam konci pred nahladom fotky, Use Photo vypadlo). Kolo 23 (Samuel: v 0:34 akoby sa dokument odfotil
  // dvakrat): zaznam ma vlastne bliknutie iOS pri odfoteni (8,583 s, tlacidlo sa zmensuje od 8,567 s), kruzok pri 8,9 s
  // s bielym bleskom prisiel o 0,33 s neskor ako druha fotka; kruzok je teraz tesne pred skutocnou spustou, biely blesk vypadol
  { t: cutTime(KF1, 8.55), x: 0.5, y: 0.824 },
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
];
export const K_F24_TAPS: Tap[] = [tapAt(KF24, 12.15, 1734, 764)]; // prijat spravnu hodnotu (Nazov projektu)
/**
 * Kolo 9 (Samuel: "Fotka je dokaz a ostava pri zazname" je duplicita): veta aj panel s fotkou vypadli, klip konci
 * 0,75 s po prijati hodnoty (zelena ciara potvrdenia), priloha s fotkou je vidiet pri vyhladavani (karta polozky).
 */
export const K_F24_END = K_F24_TAPS[0].t + 0.75;
const spot = { spot: true };
export const K_F24_MARKS: Mark[] = [
  markAt(KF24, kv(0) / 1000 + 0.9, kv(0, 1) / 1000 - 0.05, 286, 523, 331, 443, spot), // "z fotky sama precita text": fotka
  markAt(KF24, kv(0, 1) / 1000 + 0.5, segStart(KF24, 1) - 0.05, 824, 654, 428, 32, spot), // "navrhne udaje: nazov projektu": navrhnuta hodnota
];

/** F3: slovo, vysledok a cesta PL_01 / KR_01 / ZL_03 (polica, krabica, zlozka); rovnaky zostrih v K aj T. */
export const KF3 = 'k-f3-search';
export const K_F3_SECONDS = cutDuration(KF3);
/** F3: kroky a zvyraznenia podla vety klipu (16:9 aj LinkedIn). */
export const f3Steps = (clip: string): Step[] => [
  { from: 0, title: 'Napísať kľúčové slovo' }, // kolo 21 (Samuel): "napísať kľúčové slovo"
  { from: voAt(clip, 0, 1), title: 'Údaje o položke' }, // kolo 7 (Samuel): "aplikacia ukaze udaje o konkretnej polozke aj cestu k nej"
  { from: voAt(clip, 1), title: 'Cesta k položke' }, // kolo 10: "aj cestu k nej." je samostatna veta po pauze
];
/** `seconds` = dlzka klipu (K46 kolo 33 ma kratsi zostrih k46-f3-search s rovnakym orezom a segmentmi, len kratsim dobehom). */
export const f3Marks = (clip: string, seconds = K_F3_SECONDS): Mark[] => {
  const v = (k: number) => voAt(clip, 0, k);
  const path = voAt(clip, 1); // kolo 10: "aj cestu k nej." je samostatna veta po pauze
  return [
    markAt(KF3, v(0) / 1000 + 0.3, segStart(KF3, 1) + 0.1, 190, 578, 1638, 62, spot), // pole vyhladavania (pisanie slova)
    markAt(KF3, v(1) / 1000 + 0.9, path / 1000 + 0.1, 132, 830, 402, 180, spot), // vysledok ZL_03 (Zlozka, najdene v metadatach a OCR): "udaje o konkretnej polozke"
    markAt(KF3, path / 1000 + 0.1, seconds - 0.45, 596, 783, 246, 28, spot), // PL_01 / KR_01 / ZL_03: "aj cestu k nej"
  ];
};
/** Popis karty softveru (LinkedIn C8). */
export const SOFTWARE_DESC = 'Spracujete sami v našej aplikácii.';
