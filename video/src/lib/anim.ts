import { Easing, interpolate, spring } from 'remotion';
import { FPS, ms } from '../theme';

/** ease-in-out ako na webe (CSS `ease-in-out`). */
export const easeInOut = Easing.inOut(Easing.ease);
export const easeOut = Easing.out(Easing.cubic);

/**
 * Prechod 0 -> 1 zacinajuci v `startMs`, trvajuci `durMs`.
 * Zodpoveda CSS `transition: Xms ease-in-out; transition-delay: Yms`.
 */
export const tween = (
  frame: number,
  startMs: number,
  durMs: number,
  easing: (t: number) => number = easeInOut,
) =>
  interpolate(frame, [ms(startMs), ms(startMs + durMs)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });

/** Lineárny 0 -> 1 (pre pocitadla a pod.). */
export const linear = (frame: number, startMs: number, durMs: number) =>
  tween(frame, startMs, durMs, Easing.linear);

/**
 * "Dosadnutie" s jemnym overshootom - QR nalepky, chipy, checky.
 * Pred `startMs` vracia 0.
 */
export const pop = (frame: number, startMs: number, opts?: { damping?: number; stiffness?: number }) => {
  const f = frame - ms(startMs);
  if (f < 0) return 0;
  return spring({
    frame: f,
    fps: FPS,
    config: { damping: opts?.damping ?? 14, stiffness: opts?.stiffness ?? 140, mass: 0.9 },
  });
};

/** Jemne dosadnutie bez overshootu (texty, karty). */
export const settle = (frame: number, startMs: number) => {
  const f = frame - ms(startMs);
  if (f < 0) return 0;
  return spring({ frame: f, fps: FPS, config: { damping: 200, stiffness: 120 } });
};

/** Zaciatok i-teho prvku pri staggeri. */
export const stagger = (i: number, startMs: number, stepMs: number) => startMs + i * stepMs;

/** Typografia: text sa objavi posunom zdola + fade. */
export const riseStyle = (t: number, dy = 24): React.CSSProperties => ({
  opacity: t,
  transform: `translateY(${(1 - t) * dy}px)`,
});

/** stroke-dashoffset kreslenie ciary: vrati atributy pre <path>. */
export const drawProps = (t: number, length: number) => ({
  strokeDasharray: length,
  strokeDashoffset: length * (1 - t),
});
