import { defineConfig } from '../../utils';

const buildPreset = () => {
  return {
    buildType: 'bundleless',
    format: 'iife',
  };
};

export default defineConfig({
  buildPreset: buildPreset as any,
});
