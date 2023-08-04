import type { LibuildPlugin } from '@modern-js/libuild';
import { Compiler } from '@modern-js/swc-plugins';
import chalk from 'chalk';
import { getSwcTarget } from './utils';
import { umdPluginName as pluginName } from './constants';

export const umdPlugin = (filename?: string | ((filename: string) => string)): LibuildPlugin => {
  return {
    name: pluginName,
    apply(compiler) {
      // check bundle value
      compiler.hooks.initialize.tap(pluginName, () => {
        if (compiler.config.format === 'umd' && !compiler.config.bundle) {
          console.warn(chalk.yellowBright(`The ${pluginName} plugin is only work in bundle!`));
        }
      });

      compiler.hooks.processAsset.tapPromise({ name: pluginName }, async (chunk) => {
        if (
          compiler.config.format === 'umd' &&
          compiler.config.bundle &&
          chunk.fileName.endsWith('.js') &&
          chunk.type === 'chunk'
        ) {
          const name = typeof filename === 'function' ? filename(chunk.fileName) : filename ?? chunk.fileName;
          const swcCompiler = new Compiler({
            filename: name,
            sourceMaps: Boolean(compiler.config.sourceMap),
            inputSourceMap: false,
            swcrc: false,
            configFile: false,
            extensions: {},
            // transform by user-target
            jsc: { target: getSwcTarget(compiler.config.target), parser: { syntax: 'ecmascript' } },
            module: {
              type: 'umd',
            },
            isModule: 'unknown',
          });
          const result = await swcCompiler.transformSync(name, chunk.contents.toString());
          return {
            ...chunk,
            contents: result.code,
            map: typeof result.map === 'string' ? JSON.parse(result.map) : result.map,
          };
        }
        return chunk;
      });
    },
  };
};
