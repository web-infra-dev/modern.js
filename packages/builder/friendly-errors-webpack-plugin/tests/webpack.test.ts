import { describe, expect, test, vi } from 'vitest';
import webpack, { WebpackError } from 'webpack';
import _ from '@modern-js/utils/lodash';
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
    const mockedError = vi.spyOn(console, 'error').mockImplementation(_.noop);
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
      " ERROR  Error: foo
          at <ROOT>/tests/webpack.test.ts:<POS>
          at _next32 (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)
          at _next10 (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)
          at Hook.eval [as call] (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)
          at Hook.CALL_DELEGATE [as _call] (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js:<POS>)
          at Compiler.newCompilation (<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>)
          at <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>
          at Hook.eval [as callAsync] (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)
          at Hook.CALL_ASYNC_DELEGATE [as _callAsync] (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js:<POS>)
          at Compiler.compile (<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>)
          at <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>
          at Compiler.readRecords (<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>)
          at <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>
          at Hook.eval [as callAsync] (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)
          at Hook.CALL_ASYNC_DELEGATE [as _callAsync] (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js:<POS>)
          at <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>
          at Hook.eval [as callAsync] (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)
          at Hook.CALL_ASYNC_DELEGATE [as _callAsync] (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js:<POS>)
          at run (<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>)
          at Compiler.run (<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>)
          at <ROOT>/tests/webpack.test.ts:<POS>
          at new Promise (<anonymous>)
          at <ROOT>/tests/webpack.test.ts:<POS>
          at Generator.next (<anonymous>)
          at <ROOT>/tests/webpack.test.ts:<POS>
          at new Promise (<anonymous>)
          at __async (<ROOT>/tests/webpack.test.ts:<POS>)
          at webpackBuild (<ROOT>/tests/webpack.test.ts:<POS>)
          at <ROOT>/tests/webpack.test.ts:<POS>
          at Generator.next (<anonymous>)
          at fulfilled (<ROOT>/tests/webpack.test.ts:<POS>)
      "
    `);
  });

  test('throw new error', async () => {
    const mockedError = vi.spyOn(console, 'error').mockImplementation(_.noop);
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
    expect(cleanOutput(mockedError)).toMatchInlineSnapshot(`
      " ERROR  Error: bar
          at <ROOT>/tests/webpack.test.ts:<POS>
          at _next32 (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)
          at _next10 (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)
          at Hook.eval [as call] (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)
          at Hook.CALL_DELEGATE [as _call] (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js:<POS>)
          at Compiler.newCompilation (<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>)
          at <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>
          at Hook.eval [as callAsync] (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)
          at Hook.CALL_ASYNC_DELEGATE [as _callAsync] (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js:<POS>)
          at Compiler.compile (<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>)
          at <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>
          at Compiler.readRecords (<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>)
          at <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>
          at Hook.eval [as callAsync] (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)
          at Hook.CALL_ASYNC_DELEGATE [as _callAsync] (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js:<POS>)
          at <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>
          at Hook.eval [as callAsync] (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)
          at Hook.CALL_ASYNC_DELEGATE [as _callAsync] (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js:<POS>)
          at run (<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>)
          at Compiler.run (<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>)
          at <ROOT>/tests/webpack.test.ts:<POS>
          at new Promise (<anonymous>)
          at <ROOT>/tests/webpack.test.ts:<POS>
          at Generator.next (<anonymous>)
          at <ROOT>/tests/webpack.test.ts:<POS>
          at new Promise (<anonymous>)
          at __async (<ROOT>/tests/webpack.test.ts:<POS>)
          at webpackBuild (<ROOT>/tests/webpack.test.ts:<POS>)
          at <ROOT>/tests/webpack.test.ts:<POS>
          at Generator.next (<anonymous>)
          at fulfilled (<ROOT>/tests/webpack.test.ts:<POS>)"
    `);
  });
});
