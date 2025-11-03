import path from 'node:path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

test('should allow to use `postcssOptions` function to apply different postcss config for different files and overrides modern.js default plugins', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      foo: './src/foo/index.ts',
      bar: './src/bar/index.ts',
    },
    builderConfig: {
      html: {
        template({ entryName }) {
          return `./src/${entryName}/index.html`;
        },
      },
      tools: {
        postcss: config => {
          config.postcssOptions = loaderContext => {
            const name = loaderContext.resourcePath.includes('foo')
              ? 'foo'
              : 'bar';
            const tailwindConfig = path.join(
              __dirname,
              `./tailwind.config.${name}.cjs`,
            );
            return {
              plugins: [require('tailwindcss')({ config: tailwindConfig })],
            };
          };
        },
      },
    },
  });

  const files = await builder.unwrapOutputJSON();
  const fooCssFile = Object.keys(files).find(
    file => file.includes('foo.') && file.endsWith('.css'),
  )!;

  expect(files[fooCssFile]).toEqual(
    '.font-bold{font-weight:700}.underline{text-decoration-line:underline}',
  );

  const barCssFile = Object.keys(files).find(
    file => file.includes('bar.') && file.endsWith('.css'),
  )!;
  expect(files[barCssFile]).toEqual(
    '.text-3xl{font-size:1.875rem;line-height:2.25rem}',
  );
});

test('should allow to use `postcssOptions` function to apply different postcss config for different files and apply modern.js default plugins', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      foo: './src/foo/index.ts',
      bar: './src/bar/index.ts',
    },
    builderConfig: {
      html: {
        template({ entryName }) {
          return `./src/${entryName}/index.html`;
        },
      },
      tools: {
        postcss: config => {
          const originalPostcssOptions = config.postcssOptions || {};
          config.postcssOptions = loaderContext => {
            const name = loaderContext.resourcePath.includes('foo')
              ? 'foo'
              : 'bar';
            const tailwindConfig = path.join(
              __dirname,
              `./tailwind.config.${name}.cjs`,
            );
            return {
              plugins: [
                // apply modern.js default plugins
                ...(typeof originalPostcssOptions === 'object'
                  ? (originalPostcssOptions.plugins ?? [])
                  : []),
                require('tailwindcss')({ config: tailwindConfig }),
              ],
            };
          };
        },
      },
    },
  });

  const files = await builder.unwrapOutputJSON();
  const fooCssFile = Object.keys(files).find(
    file => file.includes('foo.') && file.endsWith('.css'),
  )!;
  // apply tailwind config and autoprefixer correctly
  expect(files[fooCssFile]).toEqual(
    '.font-bold{font-weight:700}.underline{text-decoration-line:underline}',
  );

  const barCssFile = Object.keys(files).find(
    file => file.includes('bar.') && file.endsWith('.css'),
  )!;
  expect(files[barCssFile]).toEqual(
    '.text-3xl{font-size:1.875rem;line-height:2.25rem}',
  );
});
