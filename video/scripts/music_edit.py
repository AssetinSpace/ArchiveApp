#!/usr/bin/env python3
"""Experiment kratkej verzie, kolo 16 az 18: hudba pre LinkedIn poskladana z taktov skladby Lyria (bez novej generacie).

Pouzitie: python3 scripts/music_edit.py [--cfg src/copy/music_kratka.json] [--variant K]
Plan je v cfg[variant]["edit"]: src (skladba), out (vysledok), downbeat (s, doba 1 taktu 0 = nastup kapely), bar (dlzka
taktu v s, zmerana na kicku), bars (poradie vo vysledku: cislo = cely takt, cislovane od taktu 0, moze byt aj viackrat;
text "28:0-2" = doby 0 az 2 taktu 28, teda jeho prva polovica), dirty (takty, na konci ktorych je stupajuci sum alebo
nadych pred zmenou), hard (poradie usekov vo vysledku, kde je vzdy tvrdy strih na dobe, napr. nastup kapely),
pre_ms, cut_out_ms, cut_in_ms.
Po sebe iduce kusy skladby sa kopiruju ako jeden usek. Strih na skoku je vzdy na dobe noveho kusu, novy kus v case
presne na svojom mieste v mriezke (bez posunu):
- ak je hudba pred novym kusom v skladbe cista: prelinacka `pre_ms`, ktora konci na dobe (novy kus nabehne koncom
  toho, co v skladbe hralo pred nim, uder na dobe ostane cely, dozvuk stareho useku sa nepreleje do noveho uderu);
- ak je pred nim sum (dirty) alebo je strih v `hard`: stary usek doznie `cut_out_ms` pred dobou a novy zacne na dobe
  s nabehom `cut_in_ms` (co v skladbe hralo pred dobou, sa nepouzije).
Zaciatok taktu pred zaciatkom skladby (prvy takt bez prvej doby) ostane ticho. Posledny usek ide az do konca skladby
(akord doznie). Vysledok: WAV float 48 kHz stereo, potom scripts/mix-music.mjs --music <out>.
"""
import argparse
import json
import subprocess

import imageio_ffmpeg
import numpy as np


def parse(item):
    """Kus planu -> (takt, od doby, do doby)."""
    if isinstance(item, str):
        b, beats = item.split(":")
        b0, b1 = beats.split("-")
        return int(b), float(b0), float(b1)
    return int(item), 0.0, 4.0


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
    beat = bar / 4
    items = [parse(it) for it in e["bars"]]
    dirty, hard = set(e.get("dirty", [])), set(e.get("hard", []))
    ms = lambda v: int(round(sr * v / 1000))
    pre, out_ms, in_ms = ms(e.get("pre_ms", 60)), ms(e.get("cut_out_ms", 15)), ms(e.get("cut_in_ms", 4))
    src_s = lambda b, bt: (db + b * bar + bt * beat) * sr  # vzorka (moze byt aj pred zaciatkom skladby)
    # useky: kusy, ktore v skladbe nasleduju tesne za sebou; o = zaciatok vo vysledku (v dobach)
    runs, o = [], 0.0
    for i, (b, b0, b1) in enumerate(items):
        if runs and abs(src_s(b, b0) - runs[-1]["s1"]) < 2:
            runs[-1]["s1"] = src_s(b, b1)
            runs[-1]["last"] = (b, b1)
        else:
            runs.append({"i": i, "o": o, "s0": src_s(b, b0), "s1": src_s(b, b1), "first": (b, b0), "last": (b, b1)})
        o += b1 - b0
    y = np.zeros((int(round(o * beat * sr)) + len(x) + sr, 2))
    end_out = 0
    for r, run in enumerate(runs):
        first, last = r == 0, r == len(runs) - 1
        o0 = int(round(run["o"] * beat * sr))
        s0 = int(round(run["s0"]))
        s1 = len(x) if last else int(round(run["s1"]))
        fb, fbt = run["first"]
        prev_clean = not first and not (fbt == 0 and (fb - 1) in dirty) and run["i"] not in hard
        head = pre if prev_clean else 0
        a0 = s0 - head
        lead = max(0, -a0)  # takt zacina pred zaciatkom skladby: tato cast ostane ticho
        seg = x[a0 + lead:s1].copy()
        if first:
            seg[:ms(5)] *= np.linspace(0, 1, ms(5))[:, None]
        elif prev_clean:
            seg[:head] *= np.sin(np.linspace(0, np.pi / 2, head))[:, None] ** 2
        else:
            seg[:in_ms] *= np.sin(np.linspace(0, np.pi / 2, in_ms))[:, None] ** 2
        if not last:  # koniec useku: dozvuk konci na dobe dalsieho useku
            nxt = runs[r + 1]
            nb, nbt = nxt["first"]
            nclean = not (nbt == 0 and (nb - 1) in dirty) and nxt["i"] not in hard
            tail = pre if nclean else out_ms
            seg[len(seg) - tail:] *= np.cos(np.linspace(0, np.pi / 2, tail))[:, None] ** 2
        start = o0 - head + lead
        y[start:start + len(seg)] += seg
        end_out = max(end_out, start + len(seg))
        how = "zaciatok" if first else ("prelinacka pred dobou" if prev_clean else "tvrdy strih na dobe")
        lb, lbt = run["last"]
        print(f"usek {r}: {fb:+d}:{fbt:g} .. {lb:+d}:{lbt:g} zo skladby {max(0, run['s0']) / sr:6.3f}-{s1 / sr:6.3f} s -> od {run['o'] * beat:6.3f} s, {how}")
    y = y[:end_out]
    subprocess.run([ff, "-v", "error", "-y", "-f", "f32le", "-ar", str(sr), "-ac", "2", "-i", "-", "-c:a", "pcm_f32le", e["out"]], input=y.astype(np.float32).tobytes(), check=True)
    print(f"{e['out']}: {end_out / sr:.2f} s, {o / 4:g} taktov")


if __name__ == "__main__":
    main()
