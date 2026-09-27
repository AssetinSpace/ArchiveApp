import React from 'react';
import { Composition, Folder } from 'remotion';
import { FPS, H, W } from './theme';
import { OPTIONAL_LIST, SCENE_LIST } from './scenesList';
import { Full } from './scenes/Full';
import { FootageFrame, footageDefaults } from './scenes/FootageFrame';
import { K_LIST } from './kratkaList';
import { K_Full, listFrames } from './scenes/kratka/KratkaFull';
import { K_LinkedIn, LI, liFrames } from './scenes/kratka/LinkedIn';

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
    {/* experiment kratkej verzie: LinkedIn 4:5 (jedina kratka verzia) a jej zaklad, klipy 16:9; hlavna verzia vyssie sa nemeni */}
    <Folder name="Kratka">
      {K_LIST.map(([id, s]) => (
        <Composition key={id} id={id} component={s.component} durationInFrames={Math.round(s.seconds * FPS)} fps={FPS} width={W} height={H} />
      ))}
      <Composition id="K-Full" component={K_Full} durationInFrames={listFrames(K_LIST)} fps={FPS} width={W} height={H} />
      {/* LinkedIn 4:5: vlastne velke titulky pod obrazom (v klipoch su vypnute) */}
      <Composition id="K-LinkedIn" component={K_LinkedIn} durationInFrames={liFrames()} fps={FPS} width={LI.w} height={LI.h} />
    </Folder>
    <Folder name="Optional">
      {OPTIONAL_LIST.map(([id, s]) => (
        <Composition key={id} id={id} component={s.component} durationInFrames={Math.round(s.seconds * FPS)} fps={FPS} width={W} height={H} />
      ))}
    </Folder>
  </>
);
