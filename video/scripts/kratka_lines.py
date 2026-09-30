#!/usr/bin/env python3
"""Experiment kratkej verzie: vety so `src` v scenari (src/copy/vo_kratka.json) vyreze z existujucich nahravok
do <dir>/lines/<klip>-<i>.wav (start/end v s, strih v pauze medzi vetami, kratke prelinanie na okrajoch).
Gemini tieto vety negeneruje (vo.mjs --reuse ich najde hotove). Povodne nahravky public/vo/ sa nemenia.

Pouzitie: python3 scripts/kratka_lines.py [--script src/copy/vo_kratka.json] [--dir public/vo-kratka]
Potom:    node scripts/vo.mjs --engine gemini --reuse --script src/copy/vo_kratka.json --dir public/vo-kratka
"""
import argparse
import json
import os
import re
import subprocess

import imageio_ffmpeg

FF = os.environ.get("FFMPEG") or imageio_ffmpeg.get_ffmpeg_exe()


def duration(path: str) -> float:
    err = subprocess.run([FF, "-i", path], capture_output=True, text=True).stderr
    m = re.search(r"Duration: (\d+):(\d+):([\d.]+)", err)
    return int(m[1]) * 3600 + int(m[2]) * 60 + float(m[3])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--script", default="src/copy/vo_kratka.json")
    ap.add_argument("--dir", default="public/vo-kratka")
    a = ap.parse_args()
    vo = json.load(open(a.script))
    os.makedirs(f"{a.dir}/lines", exist_ok=True)
    for clip, lines in vo.items():
        if not isinstance(lines, list):
            continue
        for i, line in enumerate(lines):
            src = line.get("src")
            if not src:
                continue
            out = f"{a.dir}/lines/{clip}-{i}.wav"
            full = duration(src["file"])
            start = float(src.get("start", 0))
            end = float(src.get("end", full))
            af = []
            if start > 0:
                af.append("afade=t=in:st=0:d=0.015")
            if end < full - 0.01:
                af.append(f"afade=t=out:st={end - start - 0.04:.3f}:d=0.04")
            cmd = [FF, "-v", "error", "-y", "-ss", f"{start:.3f}", "-to", f"{end:.3f}", "-i", src["file"]]
            if af:
                cmd += ["-af", ",".join(af)]
            cmd += ["-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", out]
            subprocess.run(cmd, check=True)
            print(f"{clip}-{i}: {src['file']} {start:.2f}-{end:.2f} s -> {out} ({duration(out):.2f} s)")


if __name__ == "__main__":
    main()
