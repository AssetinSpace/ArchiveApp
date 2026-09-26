import React from 'react';
import { DesktopFootageClip, Mark, Tap } from './F2_Metadata';
import { F4_STEPS } from '../copy/steps';

/**
 * F4 - Kontrola metadat (127 s zaznam "Review metadat - v2" zostrihany na 15,4 s):
 * fotka stitku zblizka (0,5-2,5 s), prvy navrh (19,8-21 s) + zmrazeny obraz
 * 1,2 s so zvyraznenou spravnou hodnotou, prijatie (21-22,3 s), montaz
 * dalsich prijati 12x (22,3-56 s) + zmrazene pocitadlo 0,5 s, rucna oprava
 * (93-99 s, 1,2x, ceruzka + pole zvyraznene), Odoslat (122,8-124,2 s, bez prazdneho zoznamu).
 */
export const F4_SECONDS = 15.4;
const F4_TAPS: Tap[] = [
  { t: 5.4, x: 0.81, y: 0.875 }, // prijat prvy navrh
  { t: 9.25, x: 0.85, y: 0.865 }, // ceruzka - upravit
  { t: 13.75, x: 0.795, y: 0.865 }, // Prijat upravu
  { t: 14.3, x: 0.46, y: 0.5 }, // Odoslat
];
const F4_MARKS: Mark[] = [
  { from: 3.2, to: 4.5, x: 0.44, y: 0.775, w: 0.4, h: 0.05, sweep: 1.0 }, // hodnota "Novostavba bytoveho domu SLNECNA 12, BRATISLAVA"
  { from: 11.0, to: 13.5, x: 0.44, y: 0.75, w: 0.42, h: 0.07, sweep: 0.8 }, // pole Hodnota pri oprave
];
export const F4_Kontrola: React.FC = () => <DesktopFootageClip src="footage/f4-review.mp4" seconds={F4_SECONDS} steps={F4_STEPS} taps={F4_TAPS} marks={F4_MARKS} />;
