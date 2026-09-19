import { Config } from '@remotion/cli/config';

// H.264 MP4, plne kompatibilne so strihovym softverom.
Config.setVideoImageFormat('jpeg');
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);

// V cloudovom prostredi (Claude Code) je Chromium predinstalovane; na PC
// si Remotion stiahne vlastne, ked premenna nie je nastavena.
if (process.env.REMOTION_CHROME) {
  Config.setBrowserExecutable(process.env.REMOTION_CHROME);
}
