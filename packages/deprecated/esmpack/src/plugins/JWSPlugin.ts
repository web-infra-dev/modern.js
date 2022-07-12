import type { EsmpackPlugin } from '../Options';
import type { Compiler } from '../Compiler';

const pluginName = 'JWSPlugin';

class JWSPlugin implements EsmpackPlugin {
  private modified: boolean = false;

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(pluginName, compilation => {
      const isTargetPackage =
        compilation.specifier === 'jws' ||
        compilation.specifier.startsWith('jws/index') ||
        compilation.specifier.startsWith('jws/lib/');

      if (isTargetPackage) {
        const cwd = compiler.options.cwd;
        compilation.hooks.rollupPluginOptions.commonjs.tap(
          pluginName,
          commonjsOptions => {
            commonjsOptions.requireReturnsDefault = 'preferred';
          },
        );
      }
    });
  }
}

export { JWSPlugin };
