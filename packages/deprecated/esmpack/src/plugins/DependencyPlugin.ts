import { builtinModules } from 'module';
import path from 'path';
import type { IsExternal } from 'rollup';
import type { Compiler } from '../Compiler';
import { BARE_SPECIFIER_REGEX } from '../constants';
import type { EsmpackPlugin } from '../Options';
import { CJSNamedExportPrefix } from '../rollup-plugins/rollup-plugin-cjs-named-export-detect';

type ExternalFunc = IsExternal;
class DependencyPlugin implements EsmpackPlugin {
  /**
   * id -> importer
   */
  private importerMap: Map<string, string> = new Map<string, string>();

  checkDependencyCandidate = (id: string) => {
    let ret: boolean = false;
    if (
      BARE_SPECIFIER_REGEX.test(id) &&
      !excludeByExtension(id) &&
      !id.startsWith(CJSNamedExportPrefix) &&
      !builtinModules.includes(id)
    ) {
      ret = true;
    }
    return ret;
  };

  getUsefulImporter = (id: string | undefined): string | undefined => {
    if (!id) {
      return undefined;
    }
    // virtual module
    if (id.startsWith('\0')) {
      const parent = this.importerMap.get(id);
      return this.getUsefulImporter(parent);
    }
    return id;
  };

  apply(compiler: Compiler) {
    compiler.hooks.initialize.tap('DependencyPlugin', () => {
      this.importerMap.clear();
    });
    compiler.hooks.compilation.tap('DependencyPlugin', compilation => {
      compilation.hooks.inputOptions.tapPromise(
        'DependencyPlugin',
        async options => {
          const originalExternal = options.external;
          const external: ExternalFunc = (
            id: string,
            importer: string | undefined,
            isResolved: boolean,
          ) => {
            if (importer) {
              this.importerMap.set(id, importer);
            }

            let ret: ReturnType<ExternalFunc> = false;
            if (!ret) {
              ret = this.checkDependencyCandidate(id);
            }
            if (!ret) {
              if ('function' === typeof originalExternal) {
                ret = originalExternal(id, importer, isResolved);
              }
            }

            if (ret) {
              const inline = compilation.inlineDependency(id);
              if (inline) {
                return false;
              }
              const usefulImporter = this.getUsefulImporter(importer);
              // add pending id
              compilation.addDependency(id, usefulImporter);
            }
            return ret;
          };

          options.external = external;
        },
      );
    });
  }
}

export { DependencyPlugin };

/**
 * id will be excluded if returns true
 */
function excludeByExtension(id: string) {
  const extname = path.extname(id);

  if (extname) {
    if (extname === '.svg') {
      return true;
    }
  }

  return false;
}
