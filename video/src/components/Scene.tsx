import React, { useEffect } from 'react';
import { AbsoluteFill, getInputProps } from 'remotion';
import { BRAND, FONT, Mode, modeColors, W } from '../theme';
import { loadFonts } from '../lib/fonts';

/**
 * Spolocny obal scen: pozadie podla rezimu, patka s logom a www ako
 * v brozure (na svetlych stranach), zeleny pas dole na tmavych.
 */
/** Render bez textu: `npx remotion render <ID> --props='{"captions":false}'` */
export const useCaptions = () => {
  const p = getInputProps() as { captions?: boolean };
  // titulky su predvolene vypnute (doriesia sa neskor); zapne ich prop captions: true
  return p.captions === true;
};

export const Scene: React.FC<{ mode?: Mode; footer?: boolean; band?: boolean; children: React.ReactNode }> = ({
  mode = 'light',
  footer = false,
  band = false,
  children,
}) => {
  useEffect(() => {
    loadFonts();
  }, []);
  const c = modeColors(mode);
  return (
    <AbsoluteFill style={{ background: mode === 'dark' ? `linear-gradient(135deg, ${c.bg} 0%, ${c.bg2} 100%)` : c.bg, overflow: 'hidden' }}>
      {children}
      {footer ? (
        <div
          style={{
            position: 'absolute',
            left: 120,
            right: 120,
            bottom: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: FONT.body,
            fontSize: 24,
            color: c.muted,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <LogoMark size={34} color={mode === 'dark' ? '#ffffff' : BRAND[700]} />
            <span style={{ width: 1, height: 28, background: c.rule }} />
            <span style={{ fontFamily: FONT.display, fontWeight: 700, color: mode === 'dark' ? '#fff' : '#0F172A' }}>
              asset<span style={{ color: BRAND[600] }}>in</span>
            </span>
            <span style={{ width: 1, height: 28, background: c.rule }} />
            <span>Archives</span>
          </div>
          <div>www.assetin.sk</div>
        </div>
      ) : null}
      {band ? (
        <div style={{ position: 'absolute', left: 0, bottom: 0, width: W * 0.42, height: 10, background: BRAND[600] }} />
      ) : null}
    </AbsoluteFill>
  );
};

/** Znacka Assetin (dom s vlnkou) - public/brand/assetin-mark.svg, ako path. */
export const LogoMark: React.FC<{ size?: number; color?: string; draw?: number }> = ({ size = 40, color = BRAND[700], draw }) => (
  <svg width={size} height={(size * 24.411) / 22.679} viewBox="0 0 22.679 24.411" style={{ display: 'block' }}>
    <path
      fill={draw === undefined ? color : 'none'}
      stroke={draw === undefined ? 'none' : color}
      strokeWidth={draw === undefined ? 0 : 0.9}
      strokeDasharray={draw === undefined ? undefined : 120}
      strokeDashoffset={draw === undefined ? undefined : 120 * (1 - draw)}
      d="M 8.964 0.135 C 8.847 0.265 4.235 5.116 2.381 7.058 C 1.885 7.578 1.479 8.016 1.479 8.032 C 1.479 8.048 1.778 8.344 2.143 8.690 L 2.806 9.320 L 3.027 9.091 C 3.149 8.965 4.499 7.548 6.028 5.941 C 7.557 4.334 8.900 2.924 9.013 2.807 L 9.219 2.595 L 13.142 6.029 L 17.066 9.463 L 17.067 14.601 C 17.068 18.904 17.061 19.777 17.024 19.971 C 16.810 21.079 15.861 22.080 14.778 22.338 C 14.039 22.514 13.016 22.293 12.343 21.813 C 11.566 21.259 11.045 20.366 10.546 18.734 C 10.187 17.561 9.850 16.957 9.171 16.267 C 8.159 15.239 6.902 14.722 5.415 14.722 C 4.206 14.722 3.129 15.084 2.190 15.806 L 1.921 16.013 L 1.902 13.259 C 1.892 11.744 1.881 10.352 1.879 10.166 L 1.874 9.826 L 0.937 9.826 L 0.000 9.826 L 0.021 12.424 C 0.032 13.853 0.042 16.156 0.042 17.542 L 0.042 20.061 L 0.986 20.061 L 1.930 20.061 L 1.968 19.801 C 2.204 18.184 3.132 17.075 4.585 16.673 C 4.981 16.564 5.885 16.572 6.308 16.690 C 6.930 16.862 7.442 17.163 7.867 17.608 C 8.317 18.078 8.485 18.397 8.778 19.338 C 9.325 21.095 9.871 22.085 10.750 22.913 C 11.547 23.663 12.503 24.091 13.736 24.249 C 15.005 24.411 16.364 23.927 17.380 22.951 C 18.209 22.154 18.691 21.276 18.869 20.236 C 18.930 19.877 18.932 19.727 18.932 15.509 C 18.932 12.759 18.943 11.153 18.962 11.153 C 18.979 11.153 19.748 11.814 20.672 12.623 C 21.595 13.432 22.360 14.089 22.372 14.084 C 22.384 14.079 22.457 14.005 22.535 13.920 L 22.676 13.766 L 22.678 11.788 C 22.679 10.700 22.675 10.275 22.669 10.844 L 22.659 11.877 L 15.939 5.998 C 12.243 2.765 9.189 0.092 9.152 0.059 C 9.086 0.000 9.085 0.001 8.964 0.135 M 0.025 11.548 C 0.025 12.503 0.029 12.899 0.034 12.426 C 0.039 11.954 0.039 11.172 0.034 10.689 C 0.029 10.206 0.025 10.592 0.025 11.548"
    />
  </svg>
);
