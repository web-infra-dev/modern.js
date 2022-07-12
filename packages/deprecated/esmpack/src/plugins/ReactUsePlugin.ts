import { modifySourceBySpecifier } from '../utils/modifySource';
import type { EsmpackPlugin } from '../Options';
import type { Compiler } from '../Compiler';

const pluginName = 'ReactUsePlugin';

class ReactUsePlugin implements EsmpackPlugin {
  private modified: boolean = false;

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(pluginName, compilation => {
      const isReactUse = compilation.specifier.includes('react-use');

      if (isReactUse) {
        const cwd = compiler.options.cwd;
        const modify = (spec: string, cb: (code: string) => string) => {
          modifySourceBySpecifier(cwd, spec, cb, compilation.logger);
        };
        compilation.hooks.initialize.tapPromise(pluginName, async () => {
          if (this.modified) {
            return;
          }

          modify('react-use/esm/util', code => {
            return code.replace(
              `export var isDeepEqual = require('fast-deep-equal/react');`,
              `import _isDeepEqual from 'fast-deep-equal/react';
export var isDeepEqual = _isDeepEqual;`,
            );
          });

          this.modified = true;
        });
      }
    });
  }
}

export { ReactUsePlugin };
