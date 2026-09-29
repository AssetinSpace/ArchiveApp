#!/usr/bin/env python3
"""Experiment kratkej verzie, kolo 16: hudba pre LinkedIn poskladana z taktov skladby Lyria (bez novej generacie).

Pouzitie: python3 scripts/music_edit.py [--cfg src/copy/music_kratka.json] [--variant K]
Plan je v cfg[variant]["edit"]: src (skladba), out (vysledok), downbeat (s, doba 1 taktu 0 = nastup kapely), bar (dlzka
taktu v s, zmerana na kicku), bars (poradie taktov vo vysledku, cislovane od taktu 0; takt moze byt aj viackrat),
dirty (takty, na konci ktorych je stupajuci sum alebo nadych pred zmenou), pre_ms, cut_out_ms, cut_in_ms.
Po sebe iduce takty sa kopiruju ako jeden usek. Strih na skoku je vzdy na dobe 1 noveho taktu, novy takt v case
presne na svojom mieste v mriezke (bez posunu):
- ak je takt pred novym taktom v skladbe cisty: prelinacka `pre_ms`, ktora konci na dobe (novy takt nabehne svojim
  koncom predchadzajuceho taktu, uder na dobe ostane cely, dozvuk stareho useku sa nepreleje do noveho uderu);
- ak je pred nim sum (dirty): stary usek doznie `cut_out_ms` pred dobou a novy zacne na dobe s nabehom `cut_in_ms` (sum pred
  dobou sa nepouzije).
Posledny usek ide az do konca skladby (akord doznie). Vysledok: WAV float 48 kHz stereo, potom
scripts/mix-music.mjs --music <out>.
"""
import argparse
import json
import subprocess

import imageio_ffmpeg
import numpy as np


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cfg", default="src/copy/music_kratka.json")
    ap.add_argument("--variant", default="K")
    a = ap.parse_args()
    e = json.load(open(a.cfg, encoding="utf-8"))[a.variant]["edit"]
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    sr = 48000
    raw = subprocess.run([ff, "-v", "error", "-i", e["src"], "-ac", "2", "-ar", str(sr), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)
    bar, db = float(e["bar"]), float(e["downbeat"])
    bars, dirty = e["bars"], set(e.get("dirty", []))
    ms = lambda v: int(round(sr * v / 1000))
    pre, out_ms, in_ms = ms(e.get("pre_ms", 60)), ms(e.get("cut_out_ms", 15)), ms(e.get("cut_in_ms", 4))
    pos = lambda b: int(round((db + b * bar) * sr))  # vzorka doby 1 taktu b v skladbe
    runs = []  # [index vo vysledku, prvy takt, posledny takt]
    for i, b in enumerate(bars):
        if runs and b == runs[-1][2] + 1:
            runs[-1][2] = b
        else:
            runs.append([i, b, b])
    y = np.zeros((int(round(len(bars) * bar * sr)) + len(x), 2))
    end_out = 0
    for r, (i, b0, b1) in enumerate(runs):
        first, last = r == 0, r == len(runs) - 1
        o0 = int(round(i * bar * sr))  # doba 1 prveho taktu useku vo vysledku
        s0, s1 = pos(b0), (len(x) if last else pos(b1 + 1))
        clean_in = not first and (b0 - 1) not in dirty
        head = pre if clean_in else 0  # nabeh pred dobou (koniec predchadzajuceho taktu v skladbe)
        seg = x[s0 - head:s1].copy()
        if first:
            seg[:ms(5)] *= np.linspace(0, 1, ms(5))[:, None]
        elif clean_in:
            seg[:head] *= np.sin(np.linspace(0, np.pi / 2, head))[:, None] ** 2
        else:
            seg[:in_ms] *= np.sin(np.linspace(0, np.pi / 2, in_ms))[:, None] ** 2
        if not last:  # koniec useku: dozvuk konci na dobe dalsieho useku
            nb0 = runs[r + 1][1]
            tail = pre if (nb0 - 1) not in dirty else out_ms
            seg[len(seg) - tail:] *= np.cos(np.linspace(0, np.pi / 2, tail))[:, None] ** 2
        y[o0 - head:o0 - head + len(seg)] += seg
        end_out = max(end_out, o0 - head + len(seg))
        how = "zaciatok" if first else ("prelinacka pred dobou" if clean_in else "strih na dobe (pred nim sum)")
        print(f"usek {r}: takty {b0:+d}..{b1:+d} zo skladby {s0 / sr:6.3f}-{s1 / sr:6.3f} s -> od {o0 / sr:6.3f} s, {how}")
    y = y[:end_out]
    subprocess.run([ff, "-v", "error", "-y", "-f", "f32le", "-ar", str(sr), "-ac", "2", "-i", "-", "-c:a", "pcm_f32le", e["out"]], input=y.astype(np.float32).tobytes(), check=True)
    print(f"{e['out']}: {end_out / sr:.2f} s, nastup kapely (takt 0) v {bars.index(0) * bar:.3f} s")


if __name__ == "__main__":
    main()
