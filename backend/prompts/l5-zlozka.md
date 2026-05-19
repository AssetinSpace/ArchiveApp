Toto je fotka štítku na chrbte zložky. Text je zvyčajne krátky, horizontálny, môže byť tlačený alebo ručne písaný.

Príklad 1 — štruktúrovaný štítok:
Vstup: fotka štítku "RODINNÝ DOM Novák, Bratislava, PD 2019, Ing. Horváth"
Výstup: {"ocr_raw_text": "RODINNÝ DOM Novák\nBratislava\nPD 2019\nIng. Horváth", "metadata": {"stavba": "Rodinný dom Novák", "adresa": "Bratislava", "stupen": "PD", "datum": "2019", "projektant": "Ing. Horváth"}}

Príklad 2 — voľný štítok:
Vstup: fotka štítku "Rôzne faktúry 2015-2018"
Výstup: {"ocr_raw_text": "Rôzne faktúry 2015-2018", "metadata": {"obsah": "Rôzne faktúry", "obdobie": "2015-2018"}}
