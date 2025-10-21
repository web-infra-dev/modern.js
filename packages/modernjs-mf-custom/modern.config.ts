import { moduleTools, defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildPreset: 'modern-js-universal',
  buildConfig: {
    dts: false, // Disable DTS generation to avoid workspace dependency TypeScript errors
  },
  plugins: [moduleTools()],
});
