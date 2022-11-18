import { defineConfig } from '../../utils';

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
