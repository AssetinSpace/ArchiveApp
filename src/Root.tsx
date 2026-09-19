import React from 'react';
import { Composition, Folder } from 'remotion';
import { FPS, H, W } from './theme';
import { SCENE_LIST } from './scenesList';
import { Full } from './scenes/Full';

export const Root: React.FC = () => (
  <>
    <Folder name="Scenes">
      {SCENE_LIST.map(([id, s]) => (
        <Composition key={id} id={id} component={s.component} durationInFrames={Math.round(s.seconds * FPS)} fps={FPS} width={W} height={H} />
      ))}
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
  </>
);
