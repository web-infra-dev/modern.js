import { modifySourceBySpecifier } from '../utils/modifySource';
import type { EsmpackPlugin } from '../Options';
import type { Compiler } from '../Compiler';

const pluginName = 'AntDesignPlugin';

class AntDesignPlugin implements EsmpackPlugin {
  private modified: boolean = false;

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(pluginName, compilation => {
      const isTargetPackage = compilation.specifier.includes('antd');

      if (isTargetPackage) {
        const cwd = compiler.options.cwd;
        const modify = (spec: string, cb: (code: string) => string) => {
          modifySourceBySpecifier(cwd, spec, cb, compilation.logger);
        };
        compilation.hooks.initialize.tapPromise(pluginName, async () => {
          if (this.modified) {
            return;
          }

          ['antd/es/icon/index.js', 'antd/lib/icon/index.js'].forEach(
            specifier => {
              modify(specifier, code => {
                return code.replace(
                  `Object.keys(allIcons).map(`,
                  `Object.keys(allIcons).filter(function(k) { return k !== 'default' && k !== '__moduleExports' }).map(`,
                );
              });
            },
          );

          this.modified = true;
        });
      }
    });
  }
}

export { AntDesignPlugin };
