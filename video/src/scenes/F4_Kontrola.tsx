import React from 'react';
import { Step } from '../components/Steps';
import { DesktopFootageClip, Mark, Tap } from './F2_Metadata';
import { cutDuration, cutTime, segPlay, segStart } from '../lib/cuts';

/**
 * F4 - Kontrola metadat: zostrih noveho zaznamu (review2.mp4, 70 s, kolo 31) podla src/footage/cuts.json.
 * Tri kroky: navrh (fotka + prvy navrh), overit a potvrdit (priblizenie fotky, fixka na spravnej hodnote,
 * prijatie, montaz 12x), opravit a odoslat (Cislo zmeny 1 -> 2, Prijat upravu, Odoslat).
 */
export const F4_SECONDS = cutDuration('f4-review');
const F4_STEPS: Step[] = [
  { from: 0, title: 'Návrh metadát' },
  { from: segStart('f4-review', 1) * 1000, title: 'Overiť a potvrdiť' },
  { from: segStart('f4-review', 4) * 1000, title: 'Opraviť a odoslať' },
];
const F4_TAPS: Tap[] = [
  { t: cutTime('f4-review', 12.45), x: 0.942, y: 0.698 }, // prijat prvy navrh
  { t: cutTime('f4-review', 43.6), x: 0.971, y: 0.671 }, // ceruzka - upravit navrh
  { t: cutTime('f4-review', 49.2), x: 0.95, y: 0.69 }, // Prijat upravu
  { t: cutTime('f4-review', 66.6), x: 0.364, y: 0.331 }, // Odoslat
];
const F4_MARKS: Mark[] = [
  { from: segStart('f4-review', 2), to: cutTime('f4-review', 12.3), x: 0.345, y: 0.555, w: 0.42, h: 0.055, sweep: 1.0 }, // hodnota "Novostavba bytoveho domu SLNECNA 12, BRATISLAVA"
  { from: cutTime('f4-review', 44.0), to: cutTime('f4-review', 49.0), x: 0.35, y: 0.64, w: 0.5, h: 0.06, sweep: 0.8 }, // pole Hodnota pri oprave
];
export const F4_Kontrola: React.FC = () => <DesktopFootageClip src="footage/f4-review.mp4" seconds={F4_SECONDS} steps={F4_STEPS} taps={F4_TAPS} marks={F4_MARKS} />;
