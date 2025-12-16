import path from 'node:path';
import { rslibConfig } from '@modern-js/rslib';
import { cloneDeep, set } from '@modern-js/utils/lodash';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  ...rslibConfig,
  lib: rslibConfig.lib?.map(libConfig => {
    const res = cloneDeep(libConfig);
    set(res, 'output.copy', [
      {
        from: './src/esm',
        to: './esm',
      },
      { from: '**/*-edge-entry.js', context: path.join(__dirname, 'src') },
    ]);
    set(res, 'source.entry.index', ['./src/**', '!src/**/*-edge-entry.js']);
    return res;
  }),
});
