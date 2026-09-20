import React from 'react';
import { Series } from 'remotion';
import { FPS } from '../theme';
import { SCENE_LIST } from '../scenesList';

/** Vsetky klipy za sebou s tvrdymi strihmi - len na kontrolu tempa. */
export const Full: React.FC = () => (
  <Series>
    {SCENE_LIST.map(([id, s]) => (
      <Series.Sequence key={id} durationInFrames={Math.round(s.seconds * FPS)}>
        <s.component />
      </Series.Sequence>
    ))}
  </Series>
);
