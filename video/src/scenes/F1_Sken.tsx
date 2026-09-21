import React from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { tween } from '../lib/anim';

/**
 * F1 - Footage: sken prveho stitku v appke (screen recording z mobilu, portret).
 * Nadvazuje na koniec C5 (biely frame = displej mobilu): fade z bielej, footage
 * celoplosne - vzadu rozmazana zvacsena kopia, v strede ostry portret na vysku
 * framu; na konci fade do bielej (C6 zacina bielou).
 * Zdroj: public/footage/f1-sken.mp4 (priecinok nie je v gite).
 */
export const F1_SRC = 'footage/f1-sken.mp4';
export const F1_SECONDS = 12.5; // drz v sulade so scenesList.ts (nahravanie prilohy zrychlene 4x)

export const FootageClip: React.FC<{ src: string; seconds: number }> = ({ src, seconds }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const fadeIn = tw(0, 400);
  const fadeOut = tw(seconds * 1000 - 500, 400);
  const white = Math.max(1 - fadeIn, fadeOut);
  const file = staticFile(src);
  return (
    <AbsoluteFill style={{ background: '#08111F', overflow: 'hidden' }}>
      {/* rozmazane pozadie z toho isteho footage */}
      <AbsoluteFill style={{ transform: 'scale(1.4)', filter: 'blur(36px) brightness(0.55)' }}>
        <OffthreadVideo src={file} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </AbsoluteFill>
      {/* ostry portret v strede, zaoblene rohy */}
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ height: 1080, aspectRatio: '884 / 1920', borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}>
          <OffthreadVideo src={file} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: '#fff', opacity: white, pointerEvents: 'none' }} />
      {/* fps sa nepouziva, ale useVideoConfig drzi kompoziciu konzistentnu */}
      <span style={{ display: 'none' }}>{fps}</span>
    </AbsoluteFill>
  );
};

export const F1_Sken: React.FC = () => <FootageClip src={F1_SRC} seconds={F1_SECONDS} />;
