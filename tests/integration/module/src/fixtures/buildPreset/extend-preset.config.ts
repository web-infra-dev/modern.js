import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildPreset({ extendPreset }) {
    return extendPreset('modern-js-node', {
      define: {
        TEST: 'test',
      },
    });
  },
});
