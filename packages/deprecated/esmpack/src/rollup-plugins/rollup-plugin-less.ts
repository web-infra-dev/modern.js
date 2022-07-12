/* eslint-disable no-debugger */
import { promises as fs } from 'fs';
import path from 'path';
import { Plugin } from 'rollup';
import less from 'less';
import { clone } from '@modern-js/utils/lodash';
import LessPluginImportNodeModules from './lessPluginImportNodeModules';

export type LessOptions = Less.Options & {
  rootFileInfo?: Less.RootFileInfo;
} & Partial<Less.RootFileInfo>;

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
 * rollup-plugin-less
 */
export function rollupPluginLess(lessOptions: LessOptions): Plugin {
  return {
    name: 'eds:rollup-plugin-less',
    resolveId(source, importer) {
      if (!source.endsWith('.less')) {
        return null;
      }
      return this.resolve(source, importer, { skipSelf: true }).then(
        resolved => {
          return resolved || null;
        },
      );
    },
    async load(id: string) {
      if (!id.endsWith('.less')) {
        return null;
      }
      const code = await fs.readFile(id, { encoding: 'utf8' });

      const finalLessOptions = clone(lessOptions);
      if (!finalLessOptions.paths) {
        finalLessOptions.paths = [];
      }
      finalLessOptions.paths = [path.dirname(id), ...finalLessOptions.paths];

      if (!('javascriptEnabled' in finalLessOptions)) {
        finalLessOptions.javascriptEnabled = true;
      }
      if (!('rewriteUrls' in finalLessOptions)) {
        finalLessOptions.rewriteUrls = 'all' as any;
      }
      if (!('math' in finalLessOptions)) {
        finalLessOptions.math = 'always';
      }
      if (!finalLessOptions.plugins) {
        finalLessOptions.plugins = [];
      }
      finalLessOptions.plugins = [
        ...finalLessOptions.plugins,
        new LessPluginImportNodeModules({
          prefix: '~',
          paths: finalLessOptions.paths,
        }),
      ];

      let css = '';
      try {
        const result = await less.render(code, finalLessOptions);
        css = result.css;
      } catch (e: any) {
        console.error(`compile less ${id} failed: ${e.message}`);
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
