import { continueRender, delayRender, staticFile } from 'remotion';

/**
 * Fonty sa nacitavaju z public/fonts (lokalne TTF), aby render nezavisel
 * od siete a bol deterministicky. Vaha 600-800 Manrope pre nadpisy,
 * 400-600 Inter pre text.
 */
const faces: Array<[string, string, number]> = [
  ['Manrope', 'Manrope-600.ttf', 600],
  ['Manrope', 'Manrope-700.ttf', 700],
  ['Manrope', 'Manrope-800.ttf', 800],
  ['Inter', 'Inter-400.ttf', 400],
  ['Inter', 'Inter-500.ttf', 500],
  ['Inter', 'Inter-600.ttf', 600],
];

let loaded: Promise<void> | null = null;

export const loadFonts = () => {
  if (loaded) return loaded;
  const handle = delayRender('Loading fonts');
  loaded = Promise.all(
    faces.map(async ([family, file, weight]) => {
      const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)})`, {
        weight: String(weight),
      });
      await face.load();
      (document.fonts as unknown as { add: (f: FontFace) => void }).add(face);
    }),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
  return loaded;
};
