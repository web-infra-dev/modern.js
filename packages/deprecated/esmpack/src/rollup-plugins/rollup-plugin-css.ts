import { promises as fs } from 'fs';
import type { Plugin } from 'rollup';
import findUp from 'find-up';
import type { AcceptedPlugin, Postcss } from 'postcss';

function getInjectorCode(name: string, code: string) {
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

type Processor = ReturnType<Postcss>;

/**
 * rollup-plugin-css
 *
 * Support installing any imported CSS into your dependencies. This isn't strictly valid
 * ESM code, but it is popular in the npm ecosystem & web development ecosystems. It also
 * solves a problem that is difficult to solve otherwise (referencing CSS from JS) so for
 * those reasons we have added default support for importing CSS into Snowpack v2.
 */
export function rollupPluginCss(projectRoot: string): Plugin {
  let postCSSConfig: null | {
    plugins: AcceptedPlugin[];
  } = null;
  let postCSSProcessor: null | Processor = null;
  return {
    name: 'eds:rollup-plugin-css',
    async buildStart() {
      const postCSSConfigPath = await findUp('postcss.config.js', {
        cwd: projectRoot,
      });
      if (postCSSConfigPath) {
        try {
          postCSSConfig = require(postCSSConfigPath);
          if (postCSSConfig && postCSSConfig.plugins) {
            const { default: postCSS } = await import('postcss');
            postCSSProcessor = postCSS(postCSSConfig.plugins);
          }
        } catch (e) {
          // no-catch
        }
      }
    },
    resolveId(source, importer) {
      if (!source.endsWith('.css')) {
        return null;
      }
      return this.resolve(source, importer, { skipSelf: true }).then(
        resolved => {
          return resolved || null;
        },
      );
    },
    async load(id: string) {
      if (!id.endsWith('.css')) {
        return null;
      }
      let code = await fs.readFile(id, { encoding: 'utf8' });
      if (postCSSProcessor) {
        try {
          const { css } = await postCSSProcessor.process(code);
          code = css;
        } catch (e) {
          this.warn({
            id,
            message: `"${id}" failed to run with postcss. Please check postcss.config.js`,
          });
        }
      } else {
        if (id.indexOf('tailwindcss') >= 0) {
          this.warn({
            id,
            message: `"${id}". Please add tailwindcss postcss plugin to postcss.config.js`,
          });
        }
      }
      const humanReadableName = id
        .replace(/.*node_modules[\/\\]/, '')
        .replace(/[\/\\]/g, '/');
      return getInjectorCode(humanReadableName, code);
    },
  };
}
