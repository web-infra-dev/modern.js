/**
 * modified from https://github.com/vitejs/vite/blob/main/packages/plugin-react/src/fast-refresh.ts
 * license at https://github.com/vitejs/vite/blob/main/LICENSE
 */
import type { File as BabelAST } from '@babel/types';
import { Plugin as RollupPlugin } from 'rollup';
import { isJsRequest } from '../utils';
import { GLOBAL_CACHE_DIR_NAME, IS_DISABLE_REACT_REFRESH } from '../constants';

const shouldTransform = (filename: string) => {
  if (IS_DISABLE_REACT_REFRESH) {
    return false;
  }

  if (
    isJsRequest(filename) &&
    !filename.includes('node_modules') &&
    !filename.includes(GLOBAL_CACHE_DIR_NAME)
  ) {
    return true;
  }

  return false;
};

export const fastRefreshPlugin = (): RollupPlugin => ({
  name: 'esm-fast-refresh',
  async transform(code: string, importer: string) {
    if (!shouldTransform(importer)) {
      return null;
    }

    const result = await require('@babel/core').transformAsync(code, {
      plugins: [
        require.resolve('@babel/plugin-syntax-import-meta'),

        require.resolve('react-refresh/babel'),
      ],
      ast: true,
      sourceMaps: true,
      sourceFileName: importer,
    });

    if (!result || !result.code || !result.code.includes('$RefreshReg$(')) {
      // no component detected in the file
      return { code };
    }

    /** React Refresh: Setup **/
    const header = `
      if (import.meta.hot) {
        var prevRefreshReg = window.$RefreshReg$;
        var prevRefreshSig = window.$RefreshSig$;
        window.$RefreshReg$ = (type, id) => {
          window.$RefreshRuntime$.register(type, ${JSON.stringify(
            importer,
          )} + " " + id)
        };
        window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
      }`;

    /** React Refresh: Connect **/
    const footer = `
      if (import.meta.hot) {
        window.$RefreshReg$ = prevRefreshReg;
        window.$RefreshSig$ = prevRefreshSig;
        ${isRefreshBoundary(result.ast!) ? `import.meta.hot.accept();` : ``}
        if (!window.__modern_js_react_refresh_timeout) {
          window.__modern_js_react_refresh_timeout = setTimeout(() => {
            window.__modern_js_react_refresh_timeout = 0;
            window.$RefreshRuntime$.performReactRefresh();
          }, 30);
        }
      }`;

    return {
      code: `${header}${result.code}${footer}`,
      map: result.map,
    };
  },
});

function isRefreshBoundary(ast: BabelAST) {
  // Every export must be a React component.
  return ast.program.body.every(node => {
    if (node.type !== 'ExportNamedDeclaration') {
      return true;
    }
    const { declaration, specifiers } = node;
    if (declaration && declaration.type === 'VariableDeclaration') {
      return declaration.declarations.every(
        ({ id }) => id.type === 'Identifier' && isComponentishName(id.name),
      );
    }
    return specifiers.every(
      ({ exported }) =>
        exported.type === 'Identifier' && isComponentishName(exported.name),
    );
  });
}

function isComponentishName(name: string) {
  return typeof name === 'string' && name[0] >= 'A' && name[0] <= 'Z';
}
