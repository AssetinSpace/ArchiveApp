import React from 'react';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { FPS } from '../theme';
import { SCENE_LIST } from '../scenesList';

export const FADE = 12;

/** Vsetky klipy za sebou s kratkym prelinanim - len na kontrolu tempa. */
export const Full: React.FC = () => (
  <TransitionSeries>
    {SCENE_LIST.flatMap(([id, s], i) => {
      const seq = (
        <TransitionSeries.Sequence key={id} durationInFrames={Math.round(s.seconds * FPS)}>
          <s.component />
        </TransitionSeries.Sequence>
      );
      if (i === 0) return [seq];
      return [<TransitionSeries.Transition key={`t${id}`} presentation={fade()} timing={linearTiming({ durationInFrames: FADE })} />, seq];
    })}
  </TransitionSeries>
);
