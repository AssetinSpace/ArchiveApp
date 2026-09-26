import React from 'react';
import { DesktopFootageClip, Mark, Tap } from './F2_Metadata';
import { F3_STEPS } from '../copy/steps';

/**
 * F3 - Vyhladavanie (16 s zaznam zostrihany na 10,3 s): rovnake zastavky
 * ~1,5 s tam, kde to ma zmysel - pisanie (0,5-2,5 s 1,3x), vysledok (2,5-4 s),
 * prechody 3x, detail (freeze 7,5 s 0,8 s), zvyraznena zhoda (freeze 10,8 s
 * 1,5 s), QR kod (14-16,1 s 1,5x + freeze 0,8 s).
 */
export const F3_SECONDS = 10.3;
const F3_TAPS: Tap[] = [
  { t: 3.1, x: 0.16, y: 0.25 }, // klik na vysledok ZL_01
];
const F3_MARKS: Mark[] = [
  { from: 0.4, to: 2.2, x: 0.108, y: 0.462, w: 0.075, h: 0.05, sweep: 1.3 }, // pisane slovo "vodovod" - jemna fixka zlava
];
/** F3 zacina z bielej (F4 konci fade-om), okno sa objavi. */
export const F3_Vyhladavanie: React.FC = () => <DesktopFootageClip src="footage/f3-search.mp4" seconds={F3_SECONDS} steps={F3_STEPS} taps={F3_TAPS} marks={F3_MARKS} enter />;
