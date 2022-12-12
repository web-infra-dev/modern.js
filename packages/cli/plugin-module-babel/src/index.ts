import { CliPlugin, ModuleTools } from '@modern-js/module-tools';
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
): CliPlugin<ModuleTools> => ({
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
