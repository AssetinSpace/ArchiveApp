#!/usr/bin/env python3
"""Kolo 26 kratkej verzie: tvary oficialneho loga Assetin Archives pre video.

Zdroj: podklady/archives-logo/ (logá od Samuela, 29. 9. 2026). Z dvojriadkoveho loga (domcek | assetin nad ARCHIVES)
a z jednoriadkoveho (domcek | assetin | ARCHIVES, pre znacku v rohu len domcek | assetin) vytiahne cesty a farby
a zapise ich do src/scenes/kratka/archivesLogo.ts, aby sa dali v LinkedIn.tsx animovat po castiach (domcek, ciara,
assetin, ARCHIVES). Farebna a inverzna verzia maju rovnake cesty, lisia sa len farby.

Pouzitie: python3 scripts/archives_logo.py
"""
import json
import re
from pathlib import Path

SRC = Path(__file__).resolve().parents[2] / "podklady" / "archives-logo"
OUT = Path(__file__).resolve().parents[1] / "src" / "scenes" / "kratka" / "archivesLogo.ts"


def elements(name):
    """Elementy loga v poradi suboru: (tag, fill, d alebo rect, transform skupiny domceka)."""
    s = (SRC / name).read_text(encoding="utf-8")
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
    two_view, two = elements("archives-logo-dvojriadkove.svg")
    _, two_inv = elements("archives-logo-dvojriadkove-inverzne.svg")
    one_view, one = elements("archives-logo-jednoriadkove.svg")
    _, one_inv = elements("archives-logo-jednoriadkove-inverzne.svg")
    # dvojriadkove: domcek, ciara, asset, in, ARCHIVES; jednoriadkove: domcek, ciara, ciara, asset, in, ARCHIVES
    assert [e[0] for e in two] == ["house", "rect", "path", "path", "path"], [e[0] for e in two]
    assert [e[0] for e in one] == ["house", "rect", "rect", "path", "path", "path"], [e[0] for e in one]
    assert two[0][2] == one[0][2], "domcek ma byt v oboch rovnaky"
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
        },
        "one": {
            "view": one_view[2:],
            "houseTransform": one[0][3],
            "divider": one[1][2],
            "asset": one[3][2],
            "in": one[4][2],
            "color": colors(one, [0, 1, 3, 4, 5]),
            "inverse": colors(one_inv, [0, 1, 3, 4, 5]),
        },
    }
    ts = (
        "// Generovane skriptom scripts/archives_logo.py z podklady/archives-logo (oficialne logo, kolo 26). Needitovat rucne.\n"
        "// two = dvojriadkove logo (domcek | assetin nad ARCHIVES), one = z jednoriadkoveho len domcek | assetin (znacka v rohu).\n"
        f"export const ARCHIVES_LOGO = {json.dumps(data, ensure_ascii=False, indent=2)} as const;\n"
    )
    OUT.write_text(ts, encoding="utf-8")
    print(f"{OUT}: {len(ts)} znakov, dvojriadkove {two_view[2:]}, jednoriadkove {one_view[2:]}")
    print("farby:", data["two"]["color"], data["two"]["inverse"])


if __name__ == "__main__":
    main()
