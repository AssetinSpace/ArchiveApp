#!/usr/bin/env python3
"""Vyrovnanie hlasitosti hudby (kolo 39): tiche casti skladby zosilni, aby boli najviac o --range dB pod plnou castou.

Pouzitie: python3 scripts/music_level.py public/music/bed.wav public/music/bed_level.wav [--range 6] [--max 20]
Lyria dala uvod (problem, 0:04-0:31) o 20-40 dB tichsi ako groove, pod hlasom ho potom nebolo pocut (Samuel).
Hlasitost sa meria po 0,1 s z okna 1,5 s (RMS), plna uroven = 90. percentil, zosilnenie = min(max, plna - range - uroven),
nikdy nie ticho (pod -60 dBFS) a nikdy nestisuje; krivka sa vyhladi (minimum v +-0,5 s a priemer 1 s), aby nebolo pocut pumpovanie a zosilnenie nezasiahlo hlasny nastup.
"""
import argparse
import subprocess

import imageio_ffmpeg
import numpy as np


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--range", type=float, default=6.0)
    ap.add_argument("--max", type=float, default=20.0)
    a = ap.parse_args()
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    sr = 48000
    raw = subprocess.run([ff, "-v", "error", "-i", a.src, "-ac", "2", "-ar", str(sr), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)
    hop = sr // 10  # krok 0,1 s
    n = len(x) // hop
    e = np.array([np.mean(x[i * hop:(i + 1) * hop] ** 2) for i in range(n)])
    w = 15  # hlasitost z okna 1,5 s (jednotlive udery neurcuju zosilnenie)
    lvl = 10 * np.log10(np.convolve(np.pad(e, (w // 2, w - w // 2 - 1), mode="edge"), np.ones(w) / w, mode="valid") + 1e-12)
    full = np.percentile(lvl[lvl > -60], 90)
    gain = np.clip(full - a.range - lvl, 0, a.max)
    gain[lvl < -60] = 0
    k = 5  # minimum v okne +-0,5 s (zosilnenie sa nepreleje do hlasneho nastupu), potom priemer 1 s
    pad = np.pad(gain, (k, k), mode="edge")
    gmin = np.array([pad[i:i + 2 * k + 1].min() for i in range(n)])
    gain = np.convolve(np.pad(gmin, (5, 4), mode="edge"), np.ones(10) / 10, mode="valid")
    t = (np.arange(n) + 0.5) * hop
    g = 10 ** (np.interp(np.arange(len(x)), t, gain) / 20)
    y = x * g[:, None]
    peak = np.max(np.abs(y))
    print(f"spicka {20 * np.log10(peak):.1f} dBFS (WAV float, nad 0 dBFS sa neoreze; mix-music.mjs hudbu stisi a obmedzi alimiterom)")
    subprocess.run([ff, "-v", "error", "-y", "-f", "f32le", "-ar", str(sr), "-ac", "2", "-i", "-", "-c:a", "pcm_f32le", a.dst], input=y.astype(np.float32).tobytes(), check=True)
    for s0, s1 in [(4, 16), (16, 31), (31, 60), (60, 140)]:
        seg = slice(s0 * 10, s1 * 10)
        print(f"  {s0}-{s1} s: {np.median(lvl[seg]):.1f} dB -> +{np.median(gain[seg]):.1f} dB")
    print(f"plna uroven {full:.1f} dBFS, {a.dst}")


if __name__ == "__main__":
    main()
