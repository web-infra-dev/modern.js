import moduleTools, { defineConfig } from '@modern-js/module-tools';
import docPlugin from '@modern-js/plugin-module-doc';

export default defineConfig({
  plugins: [
    moduleTools(),
    docPlugin({
      entries: {
        Alert: './src/alert.tsx',
        Button: './src/button.tsx',
      },
      languages: ['zh', 'en'],
    }),
  ],
  buildPreset({ extendPreset }) {
    return extendPreset('npm-component', {});
  },
});
