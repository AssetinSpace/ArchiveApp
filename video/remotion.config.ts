import { Config } from '@remotion/cli/config';

// Finalne MP4 na strih: bezstratove medzisnimky (ostre hrany iso grafiky),
// H.264, yuv420p, CRF 16.
Config.setVideoImageFormat('png');
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setCrf(16);
Config.setOverwriteOutput(true);

// V cloudovom prostredi (Claude Code) je Chromium predinstalovane; na PC
// si Remotion stiahne vlastne, ked premenna nie je nastavena.
if (process.env.REMOTION_CHROME) {
  Config.setBrowserExecutable(process.env.REMOTION_CHROME);
}
