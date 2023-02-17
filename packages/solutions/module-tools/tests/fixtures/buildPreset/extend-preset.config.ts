import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildPreset({ extendPreset }) {
    return extendPreset('modern-js-node', {
      define: {
        TEST: 'test',
      },
    });
  },
});
