import { defineConfig } from '@modern-js/self/defineConfig';

const buildPreset = () => {
  console.info('return nothing');
};

export default defineConfig({
  buildPreset: buildPreset as any,
});
