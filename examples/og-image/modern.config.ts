import { appTools, defineConfig } from '@modern-js/app-tools';
import { baseConfig } from './config/base';
import { buildOgImagesPlugin } from './config/build-og-images';

export default defineConfig({
  ...baseConfig,
  plugins: [appTools(), buildOgImagesPlugin()],
});
