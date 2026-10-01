import React from 'react';
import { Step } from '../components/Steps';
import { voAt } from '../components/Subtitles';
import { DesktopFootageClip, Mark, Panel, Tap, markAt, tapAt } from './F2_Metadata';
import { ValueCard } from '../components/AppCards';
import { cutDuration, cutTime, segStart } from '../lib/cuts';

/**
 * F4 - Kontrola metadat: zostrih noveho zaznamu (review2.mp4, 70 s) podla src/footage/cuts.json.
 * Kolo 33: zaznam ma iny zoom a rozlozenie ako stary (bocny panel zbaleny, obsah 40-1920 px), preto
 * orez 1764 x 882 od (98, 150) = cely obsah appky (fotka vlavo aj tlacidla vpravo) v sirsom okne
 * FOOTAGE_WINDOW_WIDE. Kliky a zvyraznenia v px zaznamu. Oprava (Cislo zmeny 1 -> 2) jantarovou
 * farbou na poli Hodnota, kde sa cislo meni. Kroky podla hlasu, prelinacky medzi strihmi.
 */
const ID = 'f4-review';
export const F4_SECONDS = cutDuration(ID);
const vo = (i: number, k = 0) => voAt('F4-Kontrola', i, k);
const F4_STEPS: Step[] = [
  { from: 0, title: 'Návrh údajov' }, // kolo 51: "udaje" ako v kratkej verzii
  { from: vo(1), title: 'Overiť a potvrdiť' },
  { from: vo(2), title: 'Opraviť v návrhu' },
  { from: vo(3), title: 'Overený záznam' },
];
const F4_TAPS: Tap[] = [
  tapAt(ID, 12.15, 1734, 764), // prijat prvy navrh (Nazov projektu)
  tapAt(ID, 43.6, 1775, 745), // ceruzka - upravit navrh (Cislo zmeny)
  tapAt(ID, 48.15, 1716, 789), // Prijat upravu (kolo 40: klik je v 48,15 s, rozlozenie sa meni v 48,23 s)
  tapAt(ID, 66.6, 855, 442), // Odoslat
];
const F4_MARKS: Mark[] = [
  markAt(ID, segStart(ID, 2) + 0.15, cutTime(ID, 12.1), 824, 654, 428, 32, { spot: true }), // spravna hodnota "Novostavba bytoveho domu SLNECNA 12, BRATISLAVA"
  markAt(ID, vo(1, 1) / 1000, vo(1, 1) / 1000 + 2.4, 286, 523, 331, 443, { spot: true }), // "Fotka je dokaz": ramik okolo fotky
  markAt(ID, cutTime(ID, 44.0), cutTime(ID, 48.2), 828, 668, 967, 40, { spot: true, color: 'amber' }), // oprava: pole Hodnota pri Cislo zmeny (1 -> 2); kolo 40: konci pred prijatim (48,23 s), inak ostal zlty ramik po prekliknuti
];
/**
 * Kolo 52 (ako v kratkej verzii): karta navrhu z F2 (Nazov projektu, autor, rok) je pod oknom od zaciatku, pri prijati
 * prveho navrhu (klik pri "potvrdi") zozelenie a dostane fajku; po nej sa okno znova zvacsi (fotka ako dokaz, oprava).
 */
const F4_PANELS: Panel[] = [{ from: -0.5, to: F4_TAPS[0].t + 1.6, node: <ValueCard approveAt={F4_TAPS[0].t} authorAt={0} yearAt={0} /> }];
/** F4 zacina z bielej (F2 konci fade-om), sirsie okno sa objavi. */
export const F4_Kontrola: React.FC = () => <DesktopFootageClip src="footage/f4-review.mp4" seconds={F4_SECONDS} steps={F4_STEPS} taps={F4_TAPS} marks={F4_MARKS} enter panels={F4_PANELS} />;
