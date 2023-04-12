import moduleTools, { defineConfig } from '@modern-js/module-tools';
import docPlugin from '@modern-js/plugin-module-doc';

export default defineConfig({
  plugins: [
    moduleTools(),
    docPlugin({
      entries: {
        Alert: './src/interface.ts',
      },
      languages: ['zh', 'en'],
      useTemplate: false,
      demosDir: './docs',
    }),
  ],
  buildPreset({ extendPreset }) {
    return extendPreset('npm-component', {});
  },
});
