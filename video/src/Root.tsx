import React from 'react';
import { Composition, Folder } from 'remotion';
import { FPS, H, W } from './theme';
import { OPTIONAL_LIST, SCENE_LIST } from './scenesList';
import { Full } from './scenes/Full';
import { FootageFrame, footageDefaults } from './scenes/FootageFrame';
import { K_LinkedIn, K_LinkedIn46, LI, liFrames, liFrames46 } from './scenes/kratka/LinkedIn';

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
    {/* experiment kratkej verzie: LinkedIn 4:5 (jedina kratka verzia); hlavna verzia vyssie sa nemeni */}
    <Folder name="Kratka">
      {/* LinkedIn 4:5: vlastne velke titulky pod obrazom (v klipoch su vypnute) */}
      <Composition id="K-LinkedIn" component={K_LinkedIn} durationInFrames={liFrames()} fps={FPS} width={LI.w} height={LI.h} />
      {/* kolo 32: verzia okolo 46 s z existujucich viet (bez novych nahravok), K-LinkedIn sa nemeni */}
      <Composition id="K-LinkedIn-46" component={K_LinkedIn46} durationInFrames={liFrames46()} fps={FPS} width={LI.w} height={LI.h} />
    </Folder>
    <Folder name="Optional">
      {OPTIONAL_LIST.map(([id, s]) => (
        <Composition key={id} id={id} component={s.component} durationInFrames={Math.round(s.seconds * FPS)} fps={FPS} width={W} height={H} />
      ))}
    </Folder>
  </>
);
