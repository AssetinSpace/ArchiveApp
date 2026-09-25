#!/usr/bin/env python3
"""Hlas cez Gemini TTS (zaklad: export z AI Studia, generate_content_stream, temperature 0.85, PCM -> WAV).

Pouzitie:
  python3 scripts/gemini_tts.py --text "Veta." --out out.wav [--voice "Velvet 1"] [--style "..."] [--header]
  python3 scripts/gemini_tts.py --list-voices          # vypise prompted hlasy (id v tvare voice_...)

Hlas sa zadava nazvom (prebuilt / display_name). Ak API hlasi, ze hlas neexistuje, skript vypise
prompted hlasy uctu (client.voices.list(type_=["prompted"])) a pouzije id toho, ktoreho display_name
sedi s --voice. Styl ide do speech_metadata (Part), nie do textu. --header prida "## Transcript:"
pred text (len na prvu kontrolu, ci ho model necita nahlas; predvolene sa neposiela).
Kluc: GEMINI_API_KEY v prostredi. V cloud session ho vklada proxy prostredia (generativelanguage.googleapis.com),
vtedy staci lubovolna hodnota premennej; bez nej skript posle zastupnu hodnotu.
"""
import argparse
import os
import struct
import sys

from google import genai
from google.genai import types

MODEL = "gemini-3.8-flash-tts"


def wav_from_pcm(audio: bytes, mime_type: str) -> bytes:
    bits, rate = 16, 24000
    for param in mime_type.split(";"):
        param = param.strip()
        if param.lower().startswith("rate="):
            try:
                rate = int(param.split("=", 1)[1])
            except ValueError:
                pass
        elif param.startswith("audio/L"):
            try:
                bits = int(param.split("L", 1)[1])
            except ValueError:
                pass
    bps = bits // 8
    header = struct.pack("<4sI4s4sIHHIIHH4sI", b"RIFF", 36 + len(audio), b"WAVE", b"fmt ", 16, 1, 1, rate, rate * bps, bps, bits, b"data", len(audio))
    return header + audio


def list_prompted(client):
    voices = []
    try:
        resp = client.voices.list(type_=["prompted"])
    except TypeError:
        resp = client.voices.list()
    items = getattr(resp, "voices", None) or getattr(resp, "data", None) or resp
    for v in items:
        voices.append(v)
    return voices


def resolve_voice(client, name: str):
    """Vrati VoiceConfig: najprv prebuilt podla nazvu, po chybe id prompted hlasu podla display_name."""
    return types.VoiceConfig(prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=name))


def voice_by_id(client, name: str):
    voices = list_prompted(client)
    print("Prompted hlasy uctu:", file=sys.stderr)
    for v in voices:
        print(f"  {getattr(v, 'id', '?')}  {getattr(v, 'display_name', '')}  ({getattr(v, 'language_code', '')})", file=sys.stderr)
    for v in voices:
        if (getattr(v, "display_name", "") or "").strip().lower() == name.strip().lower():
            return types.VoiceConfig(voice=v.id)
    raise SystemExit(f"Hlas '{name}' nie je medzi prompted hlasmi uctu.")


def synth(client, text: str, voice_cfg, style: str | None, header: bool) -> tuple[bytes, str]:
    body = ("## Transcript:\n" + text) if header else text
    part = types.Part.from_text(text=body)
    if style:
        part.speech_metadata = types.SpeechMetadata(style=style)
    contents = [types.Content(role="user", parts=[part])]
    config = types.GenerateContentConfig(
        temperature=0.85,
        response_modalities=["audio"],
        speech_config=types.SpeechConfig(voice_config=voice_cfg),
    )
    audio = bytearray()
    mime = ""
    for chunk in client.models.generate_content_stream(model=MODEL, contents=contents, config=config):
        if chunk.parts is None:
            continue
        p = chunk.parts[0]
        if p.inline_data and p.inline_data.data:
            audio.extend(p.inline_data.data)
            mime = p.inline_data.mime_type or mime
        elif chunk.text:
            print(chunk.text, file=sys.stderr)
    if not audio:
        raise SystemExit("API nevratilo zvuk.")
    return bytes(audio), mime


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--text")
    ap.add_argument("--out")
    ap.add_argument("--voice", default="Velvet 1")
    ap.add_argument("--style", default=None)
    ap.add_argument("--header", action="store_true")
    ap.add_argument("--list-voices", action="store_true")
    a = ap.parse_args()
    key = os.environ.get("GEMINI_API_KEY") or "proxy-injected"
    client = genai.Client(api_key=key)
    if a.list_voices:
        try:
            voices = list_prompted(client)
        except Exception as e:
            raise SystemExit(f"Zoznam hlasov zlyhal: {str(e)[:200]}")
        for v in voices:
            print(f"{getattr(v, 'id', '?')}\t{getattr(v, 'display_name', '')}\t{getattr(v, 'language_code', '')}")
        return
    if not a.text or not a.out:
        raise SystemExit("--text a --out su povinne")
    try:
        audio, mime = synth(client, a.text, resolve_voice(client, a.voice), a.style, a.header)
    except Exception as e:  # hlas nazvom neexistuje -> id prompted hlasu
        msg = str(e)
        if "API_KEY_INVALID" in msg:
            raise SystemExit("Gemini odmietol kluc (API_KEY_INVALID): skontroluj GEMINI_API_KEY alebo kluc v API credentials prostredia.")
        if "voice" in msg.lower() or "not found" in msg.lower() or "invalid" in msg.lower():
            print(f"Hlas '{a.voice}' nazvom nepresiel ({msg[:120]}), skusam id prompted hlasu.", file=sys.stderr)
            audio, mime = synth(client, a.text, voice_by_id(client, a.voice), a.style, a.header)
        else:
            raise
    data = audio if mime.startswith("audio/wav") else wav_from_pcm(audio, mime or "audio/L16;rate=24000")
    with open(a.out, "wb") as f:
        f.write(data)
    print(f"{a.out}  ({mime}, {len(audio)} B)", file=sys.stderr)


if __name__ == "__main__":
    main()
