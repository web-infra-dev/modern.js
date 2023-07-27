import { defineConfig } from '@modern-js/module-tools/defineConfig';

const buildPreset = () => {
  return [
    {
      buildType: 'bundleless',
      format: 'umd',
    },
  ];
};

export default defineConfig({
  buildPreset: buildPreset as any,
});
