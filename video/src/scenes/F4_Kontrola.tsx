import React from 'react';
import { Step } from '../components/Steps';
import { DesktopFootageClip, Mark, Tap } from './F2_Metadata';
import { cutDuration, cutTime, segPlay, segStart } from '../lib/cuts';

/**
 * F4 - Kontrola metadat: zostrih podla src/footage/cuts.json (f4-review). Kolo 29: tri
 * kroky (Overit voci fotke / Potvrdit navrhy / Opravit a odoslat), pauza pred kazdym,
 * spravna hodnota drzi 1,2 s s fixkou, montaz 12x, oprava 1,3x.
 */
export const F4_SECONDS = cutDuration('f4-review');
const F4_STEPS: Step[] = [
  { from: 0, title: 'Návrh metadát' },
  { from: segStart('f4-review', 1) * 1000, title: 'Overiť a potvrdiť' },
  { from: segStart('f4-review', 4) * 1000, title: 'Opraviť a odoslať' },
];
const F4_TAPS: Tap[] = [
  { t: cutTime('f4-review', 22.05), x: 0.81, y: 0.875 }, // prijat prvy navrh
  { t: cutTime('f4-review', 93.1), x: 0.85, y: 0.865 }, // ceruzka - upravit
  { t: cutTime('f4-review', 99.0), x: 0.795, y: 0.865 }, // Prijat upravu
  { t: cutTime('f4-review', 123.1), x: 0.46, y: 0.5 }, // Odoslat
];
const F4_MARKS: Mark[] = [
  { from: segStart('f4-review', 2), to: segPlay('f4-review', 2) + 0.2, x: 0.44, y: 0.775, w: 0.4, h: 0.05, sweep: 1.0 }, // hodnota "Novostavba bytoveho domu SLNECNA 12, BRATISLAVA" (zmrazeny obraz)
  { from: cutTime('f4-review', 95.4), to: cutTime('f4-review', 98.4), x: 0.44, y: 0.75, w: 0.42, h: 0.07, sweep: 0.8 }, // pole Hodnota pri oprave
];
export const F4_Kontrola: React.FC = () => <DesktopFootageClip src="footage/f4-review.mp4" seconds={F4_SECONDS} steps={F4_STEPS} taps={F4_TAPS} marks={F4_MARKS} />;
