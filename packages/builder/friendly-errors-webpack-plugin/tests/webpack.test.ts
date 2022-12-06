import { describe, expect, test, vi } from 'vitest';
import webpack, { WebpackError } from 'webpack';
import { useFixture, cleanOutput } from '@modern-js/e2e';
import { transformPathReplacements } from './pathReplacements';
import { FriendlyErrorsWebpackPlugin } from '@/plugin';
import { outputPrettyError } from '@/shared/utils';

export const webpackBuild = async (compiler: webpack.Compiler) => {
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      // When using run or watch, call close and wait for it to finish before calling run or watch again.
      // Concurrent compilations will corrupt the output files.
      compiler.close(closeErr => {
        console.error(closeErr);
        if (err || !stats || stats.hasErrors()) {
          const buildError: Error & { stats?: webpack.Stats } =
            err || new Error('Webpack build failed!');
          buildError.stats = stats;
          reject(buildError);
        } else {
          resolve({ stats });
        }
      });
    });
  });
};

describe('webpack', () => {
  test('compilation.errors', async () => {
    const mockedError = vi.spyOn(console, 'error');
    const options = await useFixture('@modern-js/e2e/fixtures/builder/basic', {
      copy: true,
    });
    const config: webpack.Configuration = {
      context: options.cwd,
      mode: 'production',
      entry: './index.js',
      output: {
        filename: 'main.js',
        path: options.distPath,
      },
      plugins: [
        new FriendlyErrorsWebpackPlugin({
          transformers: [transformPathReplacements],
        }),
      ],
    };
    const compiler = webpack(config);
    compiler.hooks.compilation.tap('dev', compilation => {
      compilation.errors.push(new WebpackError('foo'));
    });
    await expect(webpackBuild(compiler)).rejects.toThrow();
    expect(cleanOutput(mockedError)).toMatchInlineSnapshot(`
      " ERROR  Error: foo<STACK>
      "
    `);
  });

  test('throw new error', async () => {
    const mockedError = vi.spyOn(console, 'error');
    const options = await useFixture('@modern-js/e2e/fixtures/builder/basic', {
      copy: true,
    });
    const config: webpack.Configuration = {
      context: options.cwd,
      mode: 'production',
      entry: './index.js',
      output: {
        filename: 'main.js',
        path: options.distPath,
      },
    };
    const compiler = webpack(config);
    compiler.hooks.compilation.tap('dev', () => {
      throw new Error('bar');
    });
    await webpackBuild(compiler).catch(e =>
      outputPrettyError(e, {
        transformers: [transformPathReplacements],
      }),
    );
    expect(cleanOutput(mockedError)).toMatchInlineSnapshot(
      '" ERROR  Error: bar<STACK>"',
    );
  });
});
