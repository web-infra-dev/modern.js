/* eslint-disable no-debugger */
import { promises as fs } from 'fs';
import path from 'path';
import sass from 'sass';
import { Plugin } from 'rollup';

export interface ScssOptions {
  prefix?: string | ((code: string) => string);
  includePaths?: string[];
}

interface FixedSassOptions extends sass.Options {}

function getInjectorCode(name: string, code: string): string {
  return `
  /** EDS INJECT STYLE: ${name} */
  function __eds__injectStyle(css) {
    const headEl = document.head || document.getElementsByTagName('head')[0];
    const styleEl = document.createElement('style');
    styleEl.type = 'text/css';
    if (styleEl.styleSheet) {
      styleEl.styleSheet.cssText = css;
    } else {
      styleEl.appendChild(document.createTextNode(css));
    }
    headEl.appendChild(styleEl);
  }
  __eds__injectStyle(${JSON.stringify(code)});\n`;
}

/**
 * rollup-plugin-scss
 */
export function rollupPluginScss(scssPluginOptions: ScssOptions): Plugin {
  return {
    name: 'eds:rollup-plugin-scss',
    resolveId(source, importer) {
      if (!source.endsWith('.scss')) {
        return null;
      }
      return this.resolve(source, importer, { skipSelf: true }).then(
        resolved => {
          return resolved || null;
        },
      );
    },
    load: async function (id: string) {
      if (!id.endsWith('.scss')) {
        return null;
      }
      let code = await fs.readFile(id, { encoding: 'utf8' });

      const prefix = scssPluginOptions.prefix;
      if (prefix) {
        if ('function' === typeof prefix) {
          code = `${prefix(code)}${code}`;
        }
        if ('string' === typeof prefix) {
          code = `${prefix}${code}`;
        }
      }

      const currentDir = path.dirname(id);
      let _includePaths = [currentDir];
      if (Array.isArray(scssPluginOptions.includePaths)) {
        _includePaths = _includePaths.concat(scssPluginOptions.includePaths);
      }

      const sassOptions: FixedSassOptions = {
        data: code,
        sourceMap: false,
        includePaths: _includePaths,
        importer: (url, prev, done) => {
          if (url[0] !== '~') {
            return null;
          }

          const loc = url.slice(1);
          const tasks = sassOptions.includePaths!.map(p => {
            return new Promise((r, _j) => {
              this.resolve(loc, p).then(resolved => {
                if (resolved && resolved.id) {
                  r(resolved.id);
                }
                r(null);
              });
            });
          });
          Promise.all(tasks).then(results => {
            const result = results.find(Boolean) as string;
            if (result) {
              done({
                file: result,
              });
            } else {
              done(new Error(`Could not resolve ${loc}`));
            }
          });
        },
      };

      let css = '';
      try {
        const result = await new Promise<sass.Result>((resolve, reject) => {
          sass.render(sassOptions, (err, result) => {
            if (err) {
              return reject(err);
            }
            resolve(result);
          });
        });
        css = result.css.toString();
      } catch (e: any) {
        console.error(`compile scss ${id} failed: ${e.message}`);
        debugger;
      }
      const humanReadableName = id
        .replace(/.*node_modules[\/\\]/, '')
        .replace(/[\/\\]/g, '/');

      return {
        code: getInjectorCode(humanReadableName, css),
        map: {
          mappings: '',
        },
        moduleSideEffects: 'no-treeshake',
      };
    },
  };
}
