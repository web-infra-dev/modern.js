import { defineConfig } from '@modern-js/self';

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
