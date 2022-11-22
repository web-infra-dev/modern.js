import { defineConfig } from '@modern-js/self/defineConfig';

const buildPreset = () => {
  return {
    buildType: 'bundleless',
    format: 'iife',
  };
};

export default defineConfig({
  buildPreset: buildPreset as any,
});
