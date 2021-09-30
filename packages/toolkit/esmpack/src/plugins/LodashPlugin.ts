import type { EsmpackPlugin } from '../Options';
import type { Compiler } from '../Compiler';

const pluginName = 'LodashPlugin';

class LodashPlugin implements EsmpackPlugin {
  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(pluginName, compilation => {
      const enable = compilation.specifier.includes('lodash');
      if (enable) {
        const cwd = compiler.options.cwd;
        compilation.hooks.rollupPluginOptions.commonjs.tap(
          pluginName,
          commonjsOptions => {
            commonjsOptions.transformMixedEsModules = false;
          },
        );
      }
    });
  }
}

export { LodashPlugin };
