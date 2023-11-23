import { defineConfig } from '@modern-js/module-tools/defineConfig';

import type { CliPlugin, ModuleTools } from '@modern-js/module-tools';

export const myPlugin = (): CliPlugin<ModuleTools> => ({
  setup() {
    return {
      resolveModuleUserConfig: c => {
        return {
          ...c,
          buildPreset: undefined,
        };
      },
    };
  },
});

export default defineConfig({
  buildPreset: 'npm-component-es2015',
  plugins: [myPlugin()],
});
