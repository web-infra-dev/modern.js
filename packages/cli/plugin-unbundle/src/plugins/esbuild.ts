import { createDebugger } from '@modern-js/utils';
import { Plugin as RollupPlugin } from 'rollup';
import { codeFrameColumns } from '@babel/code-frame';
import { transform } from 'esbuild';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import { isJsRequest, getEsbuildLoader } from '../utils';
import { DEV_CLIENT_PATH, GLOBAL_CACHE_DIR_NAME } from '../constants';

const debug = createDebugger('esm:esbuild');

export const shouldProcess = (file: string, internalDir: string): boolean => {
  if (file.startsWith(DEV_CLIENT_PATH)) {
    return false;
  }

  if (file.endsWith('.svg')) {
    return true;
  }

  if (isJsRequest(file)) {
    if (file.startsWith(internalDir) || file.includes(GLOBAL_CACHE_DIR_NAME)) {
      return false;
    }
    return true;
  }

  return false;
};

export const esbuildPlugin = (
  _config: NormalizedConfig,
  _appContext: IAppContext,
): RollupPlugin => {
  // no need to import if React is already imported
  const alreadyInjectedReact = RegExp(
    [
      // match: import React from 'react'
      /import\s+React(,\s*{[^'"]*})?\s*from\s+['"]react['"]/,
      // match: import * from 'react'
      /import\s*\*\s*as\s+React\s+from\s*['"]react['"]/,
      // React is already defined, avoid conflict: var React =
      /(const|var|let)\s+React\s*=/,
    ]
      .map(exp => exp.source)
      .join('|'),
  );
  // auto inject `import react from 'react';`
  const shouldAutoInjectReact = (code: string) =>
    !alreadyInjectedReact.test(code);

  return {
    name: 'esm-esbuild',
    async transform(code: string, importer: string) {
      const { internalDirectory } = _appContext;
      if (shouldProcess(importer, internalDirectory)) {
        try {
          const result = await transform(code, {
            loader: getEsbuildLoader(importer),
            sourcefile: importer,
            sourcemap: true,
            // chrome 63 fully support dynamic import
            target: 'es2020',
          });

          return {
            code: `${
              shouldAutoInjectReact(code) ? `import React from 'react';\n` : ''
            }${result.code}`,
            map: result.map,
          };
        } catch (e: any) {
          debug(`esbuild transform error:`, e);
          if (e.errors?.length) {
            e.frame = codeFrameColumns(code, {
              start: {
                line: e.errors[0].location.line,
                column: e.errors[0].location.column,
              },
            });

            e.loc = e.errors[0].location;
          }
          throw e;
        }
      }
    },
  };
};
