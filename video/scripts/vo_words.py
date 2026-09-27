#!/usr/bin/env python3
"""Casy slov v nahravkach nahovoru (kolo 33) cez faster-whisper (model small, stiahne sa z huggingface.co).

Pouzitie: python3 scripts/vo_words.py zoznam.json
  zoznam.json = [{"file": "public/vo/lines/C7-Hierarchia-0.wav", "text": "..."}, ...]
Vypise JSON: {"<file>": [[slovo, zaciatok_s, koniec_s], ...], ...}
scripts/vo.mjs z toho urci zaciatky casti titulkov (partAt); bez faster-whisper pouzije pauzy v nahravke.
Instalacia: pip install faster-whisper
"""
import json
import sys

from faster_whisper import WhisperModel


def main():
    items = json.load(open(sys.argv[1]))
    model = WhisperModel("small", device="cpu", compute_type="int8")
    out = {}
    for it in items:
        segs, _ = model.transcribe(it["file"], language="sk", word_timestamps=True, initial_prompt=it["text"], beam_size=5)
        out[it["file"]] = [[w.word.strip(), round(w.start, 3), round(w.end, 3)] for s in segs for w in s.words]
    json.dump(out, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
