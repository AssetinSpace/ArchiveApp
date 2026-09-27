#!/usr/bin/env python3
"""Kontrola nahovoru prepisom (kolo 32/33): kazdu vetu z public/vo/lines prepise gemini-3.8-flash
(audio na vstupe) a porovna s textom vo src/copy/vo.json.

Kontroly: model neprecital hlavicku ("Transkript"), QR znie po anglicky (kju ar), kody typu PL_01
bez "nula"/"pomlcka", zhoda slov s textom aspon 0,85 (slova Assetin, Archives a QR sa do zhody nerataju).

Pouzitie:
  python3 scripts/vo_check.py                     # vsetky vety
  python3 scripts/vo_check.py F3-Vyhladavanie-2   # vybrane (klip-index od 0)
  python3 scripts/vo_check.py --regen 5           # zle vety zmaze, vygeneruje znova (vo.mjs --engine gemini --reuse)
                                                  # a skontroluje, najviac 5 kol
Kluc: GEMINI_API_KEY v prostredi (v cloud session ho vklada proxy, staci lubovolna hodnota).
"""
import argparse
import difflib
import json
import os
import re
import subprocess
import sys
import time
import unicodedata

from google import genai
from google.genai import types

MODEL = "gemini-3.8-flash"
PROMPT = ('Prepis presne, co zaznie v nahravke, foneticky slovenskym pravopisom (anglicke slova a skratky '
          'napis tak, ako ich hovoriaca vyslovila). Len prepis, nic ine.')
SKIP = {"assetin", "archives", "qr"}


def words(s: str) -> list[str]:
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    return re.findall(r"[a-z0-9]+", s)


def transcribe(client, path: str) -> str:
    data = open(path, "rb").read()
    for attempt in range(6):
        try:
            r = client.models.generate_content(model=MODEL, contents=[types.Part.from_bytes(data=data, mime_type="audio/wav"), PROMPT])
            return (r.text or "").strip()
        except Exception as e:  # kvota alebo docasna chyba
            m = re.search(r"retry in ([\d.]+)s", str(e))
            time.sleep(float(m.group(1)) + 2 if m else 15)
    return "?"


def check(text: str, heard: str) -> list[str]:
    why = []
    h = " ".join(words(heard))
    if "transkript" in h or "transcript" in h:
        why.append("hlavicka")
    if "QR" in text and not re.search(r"kj|kiu|kju|cue", h):
        why.append("QR")
    if re.search(r"[A-Z]{2}_\d", text) and re.search(r"nula|pomlck|podciark", h):
        why.append("kody")
    tw = [w for w in words(text) if w not in SKIP]
    hw = [w for w in words(heard) if w not in SKIP and not w.startswith(("aset", "arka", "arch", "kju", "kjua"))]
    ratio = difflib.SequenceMatcher(None, tw, hw).ratio()
    if ratio < 0.85:
        why.append(f"zhoda {ratio:.2f}")
    return why


def run(client, vo, keys) -> list[str]:
    bad = []
    for clip, lines in vo.items():
        if not isinstance(lines, list):
            continue
        for i, line in enumerate(lines):
            key = f"{clip}-{i}"
            if keys and key not in keys:
                continue
            path = f"public/vo/lines/{key}.wav"
            if not os.path.exists(path):
                print(f"{key:20} CHYBA  subor {path} neexistuje")
                bad.append(key)
                continue
            heard = transcribe(client, path)
            why = check(line["text"], heard)
            print(f"{key:20} {'OK ' if not why else 'ZLE'} {','.join(why):12} | {heard}", flush=True)
            if why:
                bad.append(key)
    return bad


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("keys", nargs="*")
    ap.add_argument("--regen", type=int, default=0)
    a = ap.parse_args()
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY") or "proxy-injected")
    vo = json.load(open("src/copy/vo.json"))
    bad = run(client, vo, set(a.keys))
    for n in range(a.regen):
        if not bad:
            break
        print(f"\nKolo {n + 1}: znova generujem {' '.join(bad)}", flush=True)
        for key in bad:
            for f in (f"public/vo/lines/{key}.wav", f"public/vo/lines/{key}.wav.raw.wav"):
                if os.path.exists(f):
                    os.remove(f)
        subprocess.run(["node", "scripts/vo.mjs", "--engine", "gemini", "--reuse"], check=True, stdout=subprocess.DEVNULL)
        vo = json.load(open("src/copy/vo.json"))
        bad = run(client, vo, set(bad))
    print("ZLE:", " ".join(bad))
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
