import { defineConfig } from '@modern-js/module-tools/defineConfig';

const buildPreset = () => {
  console.info('return nothing');
};

export default defineConfig({
  buildPreset: buildPreset as any,
});
