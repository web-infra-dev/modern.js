import { CliPlugin, ModuleToolsHooks } from '@modern-js/module-tools-v2';
import { babelPresetPlugin } from '@modern-js/libuild-plugin-babel-preset';

export type Options = typeof babelPresetPlugin extends (
  arg1: infer P1,
  arg2: infer P2,
) => void
  ? {
      internalPresetOptions?: P1;
      babelTransformOptions?: P2;
    }
  : never;

export const ModulePluginBabel = (
  options?: Options,
): CliPlugin<ModuleToolsHooks> => ({
  name: 'babel-plugin',
  setup: () => ({
    modifyLibuild(config) {
      config.plugins?.unshift(
        babelPresetPlugin(
          options?.internalPresetOptions,
          options?.babelTransformOptions,
        ),
      );
      return config;
    },
  }),
});
