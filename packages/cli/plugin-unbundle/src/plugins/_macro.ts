import type { NormalizedConfig } from '@modern-js/core';
import { Plugin as RollupPlugin } from 'rollup';
import { isJsRequest } from '../utils';

// support babel macros
export const macrosPlugin = (_config: NormalizedConfig): RollupPlugin => ({
  name: 'esm-babel-macros',
  async transform(code: string, importer: string) {
    if (!isJsRequest(importer) || importer.includes('node_modules/')) {
      return null;
    }

    const result = await require('@babel/core').transformAsync(code, {
      plugins: [require.resolve('babel-plugin-macros')],
      babelrc: false,
      configFile: false,
      sourceMaps: true,
      sourceFileName: importer,
    });

    return result || null;
  },
});
