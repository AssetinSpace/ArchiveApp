import React from 'react';
import { Composition, Folder } from 'remotion';
import { FPS, H, W } from './theme';
import { OPTIONAL_LIST, SCENE_LIST } from './scenesList';
import { Full } from './scenes/Full';
import { FootageFrame, footageDefaults } from './scenes/FootageFrame';

export const Root: React.FC = () => (
  <>
    <Folder name="Clips">
      {SCENE_LIST.map(([id, s]) => (
        <Composition key={id} id={id} component={s.component} durationInFrames={Math.round(s.seconds * FPS)} fps={FPS} width={W} height={H} />
      ))}
    </Folder>
    <Folder name="Footage">
      <Composition
        id="FootageFrame"
        component={FootageFrame}
        defaultProps={footageDefaults}
        calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.seconds * FPS) })}
        durationInFrames={Math.round(footageDefaults.seconds * FPS)}
        fps={FPS}
        width={W}
        height={H}
      />
    </Folder>
    <Folder name="Preview">
      <Composition
        id="Full"
        component={Full}
        durationInFrames={SCENE_LIST.reduce((a, [, s]) => a + Math.round(s.seconds * FPS), 0)}
        fps={FPS}
        width={W}
        height={H}
      />
    </Folder>
    <Folder name="Optional">
      {OPTIONAL_LIST.map(([id, s]) => (
        <Composition key={id} id={id} component={s.component} durationInFrames={Math.round(s.seconds * FPS)} fps={FPS} width={W} height={H} />
      ))}
    </Folder>
  </>
);
