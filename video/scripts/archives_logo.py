#!/usr/bin/env python3
"""Kolo 26 kratkej verzie: tvary oficialneho loga Assetin Archives pre video.

Zdroj: podklady/archives-logo-final/ (kolo 27, finalne loga: ARCHIVES tmavomodre na bielej, biele na tmavomodrej, verzia
na zelenu), dvojriadkove logo (domcek | assetin nad ARCHIVES). Cesty a farby zapise do src/scenes/kratka/archivesLogo.ts,
aby sa dali v LinkedIn.tsx animovat po castiach (domcek, ciara, assetin, ARCHIVES). Vsetky verzie maju rovnake cesty,
lisia sa len farby. Kolo 29: aj znacka v rohu je dvojriadkove logo, jednoriadkove z prvej verzie sa uz nepouziva.

Pouzitie: python3 scripts/archives_logo.py
"""
import json
import re
from pathlib import Path

FINAL = Path(__file__).resolve().parents[2] / "podklady" / "archives-logo-final"
OUT = Path(__file__).resolve().parents[1] / "src" / "scenes" / "kratka" / "archivesLogo.ts"


def elements(path):
    """Elementy loga v poradi suboru: (tag, fill, d alebo rect, transform skupiny domceka)."""
    s = path.read_text(encoding="utf-8")
    view = [float(v) for v in re.search(r'viewBox="([^"]+)"', s).group(1).split()]
    house_g = re.search(r'<g transform="([^"]+)">\s*<g transform="([^"]+)" fill="([^"]+)">\s*<path d="([^"]+)"', s)
    out = [("house", house_g.group(3), house_g.group(4), f"{house_g.group(1)} {house_g.group(2)}")]
    body = s[house_g.end():]
    for m in re.finditer(r'<(rect|path)\b([^>]*)/?>', body):
        attrs = dict(re.findall(r'([a-z-]+)="([^"]*)"', m.group(2)))
        if m.group(1) == "rect":
            out.append(("rect", attrs["fill"], [float(attrs[k]) for k in ("x", "y", "width", "height")], None))
        else:
            out.append(("path", attrs["fill"], attrs["d"], None))
    return view, out


def main():
    two_view, two = elements(FINAL / "archives-logo-na-bielom-priehladne.svg")
    _, two_inv = elements(FINAL / "archives-logo-na-navy-priehladne.svg")
    _, two_green = elements(FINAL / "archives-logo-na-zelenom.svg")  # pozadie #1a7431 je pred logom, do farieb nejde
    # poradie: domcek, ciara, asset, in, ARCHIVES
    assert [e[0] for e in two] == ["house", "rect", "path", "path", "path"], [e[0] for e in two]
    assert [e[2] for e in two] == [e[2] for e in two_inv] == [e[2] for e in two_green], "verzie maju mat rovnake cesty"
    colors = lambda els, idx: dict(zip(["house", "divider", "asset", "in", "archives"], [els[i][1] for i in idx]))
    data = {
        "houseD": two[0][2],
        "two": {
            "view": two_view[2:],
            "houseTransform": two[0][3],
            "divider": two[1][2],
            "asset": two[2][2],
            "in": two[3][2],
            "archives": two[4][2],
            "color": colors(two, [0, 1, 2, 3, 4]),
            "inverse": colors(two_inv, [0, 1, 2, 3, 4]),
            "onGreen": colors(two_green, [0, 1, 2, 3, 4]),
        },
    }
    ts = (
        "// Generovane skriptom scripts/archives_logo.py z podklady/archives-logo-final (kolo 27 a 29). Needitovat rucne.\n"
        "// two = dvojriadkove logo (domcek | assetin nad ARCHIVES): velke logo v 0:10 a na konci aj znacka v rohu.\n"
        f"export const ARCHIVES_LOGO = {json.dumps(data, ensure_ascii=False, indent=2)} as const;\n"
    )
    OUT.write_text(ts, encoding="utf-8")
    print(f"{OUT}: {len(ts)} znakov, dvojriadkove {two_view[2:]}")
    print("farby:", data["two"]["color"], data["two"]["inverse"], data["two"]["onGreen"])


if __name__ == "__main__":
    main()
