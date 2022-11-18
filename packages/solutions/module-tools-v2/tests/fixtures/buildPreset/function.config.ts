import { defineConfig } from '@modern-js/self';

export default defineConfig({
  buildPreset({ preset }) {
    return preset.NPM_COMPONENT_WITH_UMD;
  },
});
