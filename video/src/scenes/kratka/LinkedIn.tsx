import React from 'react';
import { AbsoluteFill, Series, useCurrentFrame } from 'remotion';
import { LogoMark } from '../../components/Scene';
import { voLines } from '../../components/Subtitles';
import { loadFonts } from '../../lib/fonts';
import type { SceneDef } from '../../scenesList';
import { K_LIST, T_LIST } from '../../kratkaList';
import { BRAND, FONT, FPS, INK } from '../../theme';

/**
 * Experiment: LinkedIn na vysku 4:5 (1080 x 1350). Video 16:9 v strede (1080 x 608), nad nim nadpis,
 * pod nim velke titulky. Na mobile ma 16:9 video sirku ~390 px a titulky v nom (44 px z 1080) by mali ~9 px;
 * tu maju 58 px z 1350 (~17 px na mobile). Vnutorne titulky sa vypnu props {"subtitles": false}.
 */
export const LI = { w: 1080, h: 1350, videoTop: 330, videoH: 608 };
export const LI_HEADLINE = 'Viete, kde presne leží každý váš dokument?';

/** Velke titulky pod videom: rovnake casy a casti ako Subtitles (vo_kratka.json), ina velkost a poloha. */
const BigSubtitles: React.FC<{ clip: string }> = ({ clip }) => {
  const frame = useCurrentFrame();
  const ms = (frame / 30) * 1000;
  const lines = voLines(clip);
  const cur = lines.find((l) => ms >= l.at && ms < l.at + Math.max(1200, (l.dur ?? 1500) + 250));
  if (!cur) return null;
  const k = cur.parts && cur.partAt ? Math.max(0, cur.partAt.filter((p) => ms - cur.at >= p).length - 1) : -1;
  const text = k >= 0 ? cur.parts![k] : cur.text;
  const start = cur.at + (k >= 0 ? cur.partAt![k] : 0);
  const t = Math.min(1, (ms - start) / 180);
  return (
    <div style={{ position: 'absolute', left: 70, right: 70, top: LI.videoTop + LI.videoH + 56, textAlign: 'center', fontFamily: FONT.display, fontWeight: 700, fontSize: 58, lineHeight: 1.2, letterSpacing: '-0.01em', color: INK[900], opacity: t, transform: `translateY(${(1 - t) * 10}px)` }}>
      {text}
    </div>
  );
};

const Framed: React.FC<{ list: [string, SceneDef][] }> = ({ list }) => {
  React.useEffect(() => {
    loadFonts();
  }, []);
  const seq = (render: (id: string, s: SceneDef) => React.ReactNode) => (
    <Series>
      {list.map(([id, s]) => (
        <Series.Sequence key={id} durationInFrames={Math.round(s.seconds * FPS)}>
          {render(id, s)}
        </Series.Sequence>
      ))}
    </Series>
  );
  return (
    <AbsoluteFill style={{ background: INK[100] }}>
      {/* hlavicka: znacka a nadpis (nemenny, aby ho pochopil aj ten, kto len listuje bez zvuku) */}
      <div style={{ position: 'absolute', left: 70, top: 58, display: 'flex', alignItems: 'center', gap: 14, fontFamily: FONT.body, fontSize: 30, color: INK[500] }}>
        <LogoMark size={40} color={BRAND[700]} />
        <span style={{ width: 2, height: 32, background: INK[200] }} />
        <span style={{ fontFamily: FONT.display, fontWeight: 700, color: INK[900] }}>
          asset<span style={{ color: BRAND[600] }}>in</span>
        </span>
        <span style={{ width: 2, height: 32, background: INK[200] }} />
        <span>Archives</span>
      </div>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 138, fontFamily: FONT.display, fontWeight: 800, fontSize: 66, lineHeight: 1.08, letterSpacing: '-0.025em', color: INK[900] }}>{LI_HEADLINE}</div>
      {/* video 16:9 (klipy bez vnutornych titulkov) */}
      <div style={{ position: 'absolute', left: 0, top: LI.videoTop, width: LI.w, height: LI.videoH, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${LI.w / 1920})`, transformOrigin: '0 0' }}>{seq((_, s) => <s.component />)}</div>
      </div>
      {seq((id) => <BigSubtitles clip={id} />)}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 52, textAlign: 'center', fontFamily: FONT.body, fontWeight: 600, fontSize: 28, color: BRAND[700] }}>www.assetin.sk</div>
    </AbsoluteFill>
  );
};

export const K_LinkedIn: React.FC = () => <Framed list={K_LIST} />;
export const T_LinkedIn: React.FC = () => <Framed list={T_LIST} />;
