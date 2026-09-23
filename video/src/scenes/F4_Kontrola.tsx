import React from 'react';
import { Step } from '../components/Steps';
import { DesktopFootageClip, Mark, Tap } from './F2_Metadata';

/**
 * F4 - Kontrola metadat (127 s zaznam "Review metadat - v2" zostrihany na 12,9 s):
 * fotka stitku zblizka (0,5-1,7 s), prvy navrh (19,8-21 s) + zmrazeny obraz
 * 1,2 s so zvyraznenou spravnou hodnotou, prijatie (21-22,3 s), montaz
 * dalsich prijati 12x (22,3-56 s) + zmrazene pocitadlo 0,5 s, rucna oprava
 * (93,2-97,5 s, 1,8x), Odoslat a prazdny zoznam (122,8-126,5 s, 1,6x).
 */
export const F4_SECONDS = 12.9;
const F4_STEPS: Step[] = [
  { from: 0, title: 'Fotka je dôkaz', line: 'Každý návrh sa dá kedykoľvek overiť voči fotke štítku.' },
  { from: 2400, title: 'Správny návrh', line: 'Názov projektu prečítaný z fotky. Sedí, stačí potvrdiť.' },
  { from: 4900, title: 'Návrhy metadát', line: 'Aplikácia navrhla 25 hodnôt. Každú potvrdíte jedným klikom.' },
  { from: 8200, title: 'Oprava', line: 'Čo nesedí, opravíte priamo v návrhu.' },
  { from: 10600, title: 'Odoslať', line: 'Až po kontrole človekom sú metadáta platné.' },
];
const F4_TAPS: Tap[] = [
  { t: 4.6, x: 0.81, y: 0.875 }, // prijat navrh
  { t: 10.15, x: 0.795, y: 0.865 }, // prijat upravu
  { t: 10.7, x: 0.46, y: 0.5 }, // Odoslat
];
const F4_MARKS: Mark[] = [
  { from: 2.4, to: 4.4, x: 0.43, y: 0.74, w: 0.45, h: 0.09 }, // hodnota "Novostavba bytoveho domu SLNECNA 12"
];
export const F4_Kontrola: React.FC = () => <DesktopFootageClip src="footage/f4-review.mp4" seconds={F4_SECONDS} steps={F4_STEPS} taps={F4_TAPS} marks={F4_MARKS} />;
