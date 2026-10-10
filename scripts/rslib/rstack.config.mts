import { define } from 'rstack';

define.lib({
  lib: [
    {
      format: 'cjs',
      syntax: 'es2021',
      bundle: false,
      outBase: './src',
      output: {
        distPath: {
          root: './dist/cjs',
        },
        target: 'node',
      },
      dts: {
        distPath: 'dist/types',
      },
      autoExtension: true,
    },
  ],
});
