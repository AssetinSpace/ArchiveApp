import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { easeInOut } from './anim';
import { H, W, ms } from '../theme';

export type CameraKey = { ms: number; x?: number; y?: number; scale?: number };

/**
 * Kamera: obal ilustracnej vrstvy s transformaciou podla keyframov.
 * x, y = posun stredu zaujmu v px (kladne x = kamera ide doprava, t. j.
 * obsah sa posunie dolava), scale = priblizenie okolo stredu framu.
 * Medzi keyframami sa interpoluje ease-in-out; pred prvym / po poslednom
 * sa hodnota drzi.
 */
export const Camera: React.FC<{ keys: CameraKey[]; children: React.ReactNode; style?: React.CSSProperties }> = ({ keys, children, style }) => {
  const frame = useCurrentFrame();
  const get = (k: 'x' | 'y' | 'scale') => {
    const def = k === 'scale' ? 1 : 0;
    const pts = keys.map((kf) => ({ f: ms(kf.ms), v: kf[k] ?? def }));
    if (pts.length === 1) return pts[0].v;
    return interpolate(
      frame,
      pts.map((p) => p.f),
      pts.map((p) => p.v),
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut },
    );
  };
  const x = get('x'),
    y = get('y'),
    s = get('scale');
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transformOrigin: `${W / 2}px ${H / 2}px`,
        transform: `scale(${s}) translate(${-x}px, ${-y}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
