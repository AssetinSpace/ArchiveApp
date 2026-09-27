import React from 'react';
import { Series } from 'remotion';
import { FPS } from '../../theme';
import type { SceneDef } from '../../scenesList';
import { K_LIST, T_LIST } from '../../kratkaList';

/** Klipy experimentu za sebou (tvrde strihy), na kontrolu tempa; finalny film s hudbou sklada scripts/mix-music.mjs. */
const SeriesOf: React.FC<{ list: [string, SceneDef][] }> = ({ list }) => (
  <Series>
    {list.map(([id, s]) => (
      <Series.Sequence key={id} durationInFrames={Math.round(s.seconds * FPS)}>
        <s.component />
      </Series.Sequence>
    ))}
  </Series>
);
export const K_Full: React.FC = () => <SeriesOf list={K_LIST} />;
export const T_Full: React.FC = () => <SeriesOf list={T_LIST} />;
export const listFrames = (list: [string, SceneDef][]) => list.reduce((a, [, s]) => a + Math.round(s.seconds * FPS), 0);
