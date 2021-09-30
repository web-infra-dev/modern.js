import type { EsmpackPlugin } from '../Options';
import type { Compiler } from '../Compiler';
import { modifySourceBySpecifier } from '../utils/modifySource';

const pluginName = 'XlsxPlugin';

class XlsxPlugin implements EsmpackPlugin {
  private modified: boolean = false;
  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(pluginName, compilation => {
      if (this.modified) {
        return;
      }
      const enable = compilation.specifier.includes('xlsx');
      if (enable) {
        const cwd = compiler.options.cwd;
        const modify = (spec: string, cb: (code: string) => string) => {
          modifySourceBySpecifier(cwd, spec, cb, compilation.logger);
        };

        compilation.hooks.initialize.tapPromise(pluginName, async () => {
          modify('xlsx/package.json', content => {
            const data = JSON.parse(content);
            delete data['browser'];
            return JSON.stringify(data);
          });
        });
      }
    });
  }
}

export { XlsxPlugin };
