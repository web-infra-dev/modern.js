import { defineConfig } from '@modern-js/self';

const buildPreset = () => {
  console.info('return nothing');
};

export default defineConfig({
  buildPreset: buildPreset as any,
});
