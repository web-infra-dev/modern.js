import type { TransformOptions as BabelTransformOptions } from '@babel/core';
import type {
  CliPlugin,
  ICompiler,
  ModuleTools,
} from '@modern-js/module-tools';
import { isJsExt, isJsLoader } from '@modern-js/module-tools/utils';

const name = 'babel';

export const getBabelHook = (options?: BabelTransformOptions) => ({
  name,
  apply(compiler: ICompiler) {
    compiler.hooks.transform.tapPromise({ name }, async args => {
      if (isJsExt(args.path) || isJsLoader(args.loader)) {
        const result = await require('@babel/core').transformAsync(args.code, {
          filename: args.path,
          sourceMaps: Boolean(compiler.config.sourceMap),
          sourceType: 'unambiguous',
          inputSourceMap: false,
          babelrc: false,
          configFile: false,
          compact: false,
          exclude: [/\bcore-js\b/],
          ...options,
        });
        return {
          ...args,
          code: result?.code,
          map: result?.map,
        };
      }
      return args;
    });
  },
});

export const modulePluginBabel = (
  options?: BabelTransformOptions,
): CliPlugin<ModuleTools> => ({
  name: 'babel-plugin',
  setup: () => ({
    beforeBuildTask(config) {
      const hook = getBabelHook(options);
      config.hooks.push(hook);
      return config;
    },
  }),
});

/**
 * deprecated named export, use modulePluginBabel instead.
 * @deprecated
 */
export const ModulePluginBabel = modulePluginBabel;
