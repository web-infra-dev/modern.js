import path from 'path';
import { rslibConfig } from '@modern-js/rslib';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  ...rslibConfig,
  lib: rslibConfig.lib?.map(libConfig => {
    return {
      ...libConfig,
      source: {
        ...libConfig.source,
        entry: {
          index: [
            './src/**',
            '!src/plugins/deploy/platforms/templates/*.mjs',
            '!src/plugins/deploy/platforms/templates/*.cjs',
          ],
        },
      },
      output: {
        ...libConfig.output,
        // `src/esm` is also matched by the `./src/**` entry, so the bundler
        // emits these files itself. The ESM outputs keep the `.mjs` extension,
        // which means bundle and copy write the very same paths — two writers
        // for one file, occasionally leaving it truncated and unparsable, which
        // takes down every `"type": "module"` project. The CJS output emits
        // `.js`, so there the copy is the only thing providing the `.mjs`
        // loaders that `register()` resolves by name; keep it for that alone.
        copy: [
          ...(libConfig.format === 'esm'
            ? []
            : [
                {
                  from: './src/esm',
                  to: './esm',
                },
              ]),
          {
            from: 'plugins/deploy/platforms/templates/*.cjs',
            context: path.join(__dirname, 'src'),
          },
          {
            from: 'plugins/deploy/platforms/templates/*.mjs',
            context: path.join(__dirname, 'src'),
          },
        ],
      },
    };
  }),
});
