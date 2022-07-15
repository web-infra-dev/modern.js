import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    packageFields: {
      main: 'CJS+ES6',
      module: 'ESM+ES5',
      'jsnext:modern': 'ESM+ES6',
    },
  },
});
