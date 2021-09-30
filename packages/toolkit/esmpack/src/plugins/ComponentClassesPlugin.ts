import { modifySourceBySpecifier } from '../utils/modifySource';
import type { EsmpackPlugin } from '../Options';
import type { Compiler } from '../Compiler';

const pluginName = 'ComponentClassesPlugin';

class ComponentClassesPlugin implements EsmpackPlugin {
  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(pluginName, compilation => {
      const enable = compilation.specifier === 'component-classes';
      if (enable) {
        const cwd = compiler.options.cwd;
        modifySourceBySpecifier(
          cwd,
          'component-classes/index.js',
          code => {
            return code.replace(
              `var index = require('indexof');`,
              `throw new Error('');`,
            );
          },
          compilation.logger,
        );
      }
    });
  }
}

export { ComponentClassesPlugin };
