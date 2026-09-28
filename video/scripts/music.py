#!/usr/bin/env python3
"""Hudba cez Lyria (Gemini API, generateContent), kolo 37.

Pouzitie: python3 scripts/music.py [--prompt-file src/copy/music.json] [--out public/music/bed.wav] [--force]
Prompt a model su v src/copy/music.json. Vysledok sa cachuje: <out>.prompt.txt drzi prompt, z ktoreho vznikol;
znova sa generuje len pri zmene promptu alebo s --force (Lyria ma obmedzenu kvotu, Samuel: setrit).
Kluc: GEMINI_API_KEY; v cloud session ho vklada proxy prostredia (generativelanguage.googleapis.com), staci zastupna hodnota.
Vystup: audio z odpovede (mp3 / wav / PCM) sa ulozi ako je a prevedie na WAV 48 kHz stereo cez ffmpeg (imageio_ffmpeg).
"""
import argparse
import json
import os
import re
import subprocess
import sys
import time

from google import genai
from google.genai import types


def ffmpeg():
    import imageio_ffmpeg

    return imageio_ffmpeg.get_ffmpeg_exe()


def ext_for(mime: str) -> str:
    m = mime.lower()
    if "mpeg" in m or "mp3" in m:
        return ".mp3"
    if "wav" in m:
        return ".wav"
    if "flac" in m:
        return ".flac"
    if "ogg" in m or "opus" in m:
        return ".ogg"
    return ".raw"


def generate(client, model: str, prompt: str):
    last = None
    for attempt in range(4):
        try:
            # stream: pri dlhom generovani (celá skladba) drzi spojenie, bez neho brana po ~30 s vrati 502
            chunks = list(client.models.generate_content_stream(model=model, contents=prompt, config=types.GenerateContentConfig(response_modalities=["AUDIO"])))
            return chunks
        except Exception as e:  # 429: pockat podla retryDelay
            last = e
            msg = str(e)
            if "502" in msg and attempt < 1:
                print("502, este raz", file=sys.stderr)
                time.sleep(5)
                continue
            if "API_KEY_INVALID" in msg:
                raise SystemExit("Kluc Gemini API je neplatny (proxy / GEMINI_API_KEY).")
            if "429" in msg or "RESOURCE_EXHAUSTED" in msg:
                m = re.search(r"retryDelay['\"]?:\s*['\"]?(\d+)", msg)
                wait = int(m.group(1)) + 2 if m else 30
                if "PerDay" in msg or "per day" in msg.lower():
                    raise SystemExit(f"Denna kvota Lyria je vycerpana: {msg[:400]}")
                print(f"429, cakam {wait} s", file=sys.stderr)
                time.sleep(wait)
                continue
            raise
    raise last


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prompt-file", default="src/copy/music.json")
    ap.add_argument("--out", default="public/music/bed.wav")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    cfg = json.load(open(a.prompt_file))
    prompt, model = cfg["prompt"], cfg.get("model", "lyria-3-pro-preview")
    stamp = a.out + ".prompt.txt"
    if not a.force and os.path.exists(a.out) and os.path.exists(stamp) and open(stamp).read() == model + "\n" + prompt:
        print(f"{a.out}: prompt sa nezmenil, pouzivam ulozenu hudbu")
        return
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY") or "proxy-injected")
    chunks = generate(client, model, prompt)
    audio, texts = [], []
    for resp in chunks:
        for c in resp.candidates or []:
            for p in (c.content.parts if c.content else []) or []:
                if getattr(p, "inline_data", None) and p.inline_data.data:
                    audio.append(p.inline_data)
                elif getattr(p, "text", None):
                    texts.append(p.text)
    if texts:
        print("Text v odpovedi:", " ".join(texts)[:600], file=sys.stderr)
    if not audio:
        raise SystemExit(f"Odpoved bez audia: {str(chunks)[:800]}")
    # stream moze poslat audio po kuskoch rovnakeho typu: spojit
    blob = types.Blob(mime_type=audio[0].mime_type, data=b"".join(x.data for x in audio if x.mime_type == audio[0].mime_type))
    raw = os.path.splitext(a.out)[0] + ".src" + ext_for(blob.mime_type or "")
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    open(raw, "wb").write(blob.data)
    print(f"mime {blob.mime_type}, {len(blob.data)} B -> {raw}")
    if raw.endswith(".raw"):
        rate = re.search(r"rate=(\d+)", blob.mime_type or "")
        args = ["-f", "s16le", "-ar", rate.group(1) if rate else "48000", "-ac", "2"]
    else:
        args = []
    subprocess.run([ffmpeg(), "-v", "error", "-y", *args, "-i", raw, "-ar", "48000", "-ac", "2", a.out], check=True)
    open(stamp, "w").write(model + "\n" + prompt)
    out = subprocess.run([ffmpeg(), "-i", a.out], capture_output=True, text=True).stderr
    print(re.search(r"Duration: [0-9:.]+", out).group(0), "->", a.out)


if __name__ == "__main__":
    main()
