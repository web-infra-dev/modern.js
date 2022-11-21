import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildPreset({ preset }) {
    return preset.NPM_COMPONENT_WITH_UMD;
  },
});
