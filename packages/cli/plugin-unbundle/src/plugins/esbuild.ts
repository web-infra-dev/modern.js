import { createDebugger } from '@modern-js/utils';
import { Plugin as RollupPlugin } from 'rollup';
import { codeFrameColumns } from '@babel/code-frame';
import { transform } from 'esbuild';
import { IAppContext, NormalizedConfig } from '@modern-js/core';
import { isJsRequest, getEsbuildLoader } from '../utils';
import { DEV_CLIENT_PATH, GLOBAL_CACHE_DIR_NAME } from '../constants';

const debug = createDebugger('esm:esbuild');

export const shouldProcess = (file: string): boolean => {
  if (file.startsWith(DEV_CLIENT_PATH)) {
    return false;
  }

  if (file.endsWith('.svg')) {
    return true;
  }

  if (isJsRequest(file)) {
    if (
      /node_modules(?!\/.modern-js\/)/.test(file) ||
      file.includes(GLOBAL_CACHE_DIR_NAME)
    ) {
      return false;
    }
    return true;
  }

  return false;
};

export const esbuldPlugin = (
  _config: NormalizedConfig,
  _appContext: IAppContext,
): RollupPlugin => {
  // auto inject `import react from 'react';`
  const shouldAutoInjectReact = (code: string) =>
    !/import\s+React(,\s*{[^'"]*})?\s*from\s+['"]react['"]|import\s+\*\s+as\s+React\s+from\s+['"]react['"]/.test(
      code,
    );

  return {
    name: 'esm-esbuild',
    async transform(code: string, importer: string) {
      if (shouldProcess(importer)) {
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
