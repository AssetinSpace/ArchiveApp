import React from 'react';
import { AbsoluteFill, Composition, OffthreadVideo, staticFile } from 'remotion';
import { FPS, H, W } from '../theme';
import { SCENE_LIST } from '../scenesList';

/**
 * Nahradny render footage klipov bez zdrojoveho footage (public/footage nie je v gite):
 * starsi render klipu (old/<ID>.mp4) je pod spodom a nova verzia klipu sa kresli
 * iba v pase vpravo od zariadenia (panel s krokmi). Hodi sa, ked sa meni len text krokov.
 * Public dir musi obsahovat old/<ID>.mp4 a footage/* (lubovolne mp4, v orezanej casti sa nezobrazia).
 *   npx remotion render src/patch/index.ts Patch-F3-Vyhladavanie out/mp4/F3-Vyhladavanie.mp4 --public-dir=<dir>
 */
const PANEL_LEFT: Record<string, number> = {
  'F1-Sken': 880, // mobil konci na x 815, text zacina na 960
  'F2-Metadata': 1368, // okno konci na x 1340, kroky zacinaju na 1380
  'F3-Vyhladavanie': 1368,
  'F4-Kontrola': 1368,
};

const Patch: React.FC<{ id: string; Comp: React.FC }> = ({ id, Comp }) => (
  <AbsoluteFill style={{ background: '#fff' }}>
    <OffthreadVideo src={staticFile(`old/${id}.mp4`)} muted />
    <AbsoluteFill style={{ clipPath: `inset(0 0 0 ${PANEL_LEFT[id]}px)` }}>
      <Comp />
    </AbsoluteFill>
  </AbsoluteFill>
);

export const PatchRoot: React.FC = () => (
  <>
    {SCENE_LIST.filter(([id]) => id in PANEL_LEFT).map(([id, s]) => (
      <Composition key={id} id={`Patch-${id}`} component={() => <Patch id={id} Comp={s.component} />} durationInFrames={Math.round(s.seconds * FPS)} fps={FPS} width={W} height={H} />
    ))}
  </>
);
