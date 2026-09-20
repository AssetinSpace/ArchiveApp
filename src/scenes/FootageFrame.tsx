import React from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { PhoneFrame, WindowFrame } from '../components/Device';
import { tween } from '../lib/anim';
import { loadFonts } from '../lib/fonts';
import { FONT, INK } from '../theme';

/**
 * FootageFrame: footage z aplikacie v ramiku zariadenia v style videa.
 *  src     cesta v public/ (napr. "footage/kr01.mp4") alebo URL; bez src = placeholder
 *  device  'phone' | 'window'
 *  enter   na zaciatku sa ramik zmensi z celeho framu do zariadenia (nadvazuje na C4/C5/C6)
 *  exit    na konci sa ramik roztiahne na cely frame
 *  seconds dlzka klipu
 *
 * Render: npx remotion render FootageFrame out/mp4/F1.mp4 --props='{"src":"footage/kr01.mp4","device":"phone","enter":true}'
 */
export type FootageProps = { src?: string; device: 'phone' | 'window'; enter?: boolean; exit?: boolean; seconds: number };

export const footageDefaults: FootageProps = { device: 'phone', enter: true, exit: false, seconds: 8 };

const PHONE = { x: 720, y: 60, w: 480, h: 960 };
const WIN = { x: 160, y: 90, w: 1600, h: 900 };

export const FootageFrame: React.FC<FootageProps> = ({ src, device, enter, exit, seconds }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  React.useEffect(() => {
    loadFonts();
  }, []);
  const inT = enter ? 1 - tween(frame, 400, 900) : 0;
  const outT = exit ? tween(frame, ((durationInFrames - Math.round(1.3 * fps)) / fps) * 1000, 900) : 0;
  const fill = Math.max(inT, outT);
  const content = src ? (
    <OffthreadVideo src={src.startsWith('http') ? src : staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  ) : (
    <div style={{ position: 'absolute', inset: 0, background: INK[100], display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.body, fontSize: 40, color: INK[500] }}>
      footage · {seconds} s
    </div>
  );
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      {device === 'phone' ? (
        <PhoneFrame at={PHONE} fill={fill}>{content}</PhoneFrame>
      ) : (
        <WindowFrame at={WIN} fill={fill}>{content}</WindowFrame>
      )}
    </AbsoluteFill>
  );
};
