import type { CliPlugin, ModuleTools } from '@modern-js/module-tools-v2';

export const ModuleTargetPlugin = (
  // refer: https://esbuild.github.io/api/#target
  options: { target: string[] },
): CliPlugin<ModuleTools> => ({
  name: 'module-target',
  setup: () => ({
    modifyLibuild(config) {
      config.esbuildOptions = c => {
        c.target = options.target;
        return c;
      };
      return config;
    },
  }),
});
