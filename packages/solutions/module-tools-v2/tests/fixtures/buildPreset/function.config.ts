import { defineConfig } from '../../utils';

export default defineConfig({
  buildPreset({ preset }) {
    return preset.NPM_COMPONENT_WITH_UMD;
  },
});
