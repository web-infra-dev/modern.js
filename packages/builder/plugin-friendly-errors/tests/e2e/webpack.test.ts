import util from 'util';
import { expect, test } from 'vitest';
import { WebpackError } from 'webpack';
import webpack, {
  webpackBuild,
} from '@modern-js/builder-webpack-provider/webpack';
import { useFixture } from '@modern-js/e2e';
import { FriendlyErrorsWebpackPlugin } from '@/plugin';
import { outputPrettyError } from '@/shared/utils';

const useOutput = () => {
  let buf = '';
  const log = (...args: any[]) => {
    buf += util.format(...args);
    buf += '\n';
  };
  const handle = (out: any) => log(out);
  const toString = () => buf;
  return { handle, toString, log };
};

test('fixture', async () => {
  const options = await useFixture('@modern-js/e2e/fixtures/builder/basic', {
    copy: true,
  });
  const output = useOutput();
  const config: webpack.Configuration = {
    context: options.cwd,
    mode: 'production',
    entry: './index.js',
    output: {
      filename: 'main.js',
      path: options.distPath,
    },
    plugins: [new FriendlyErrorsWebpackPlugin({ output: output.handle })],
  };
  const compiler = webpack(config);
  compiler.hooks.compilation.tap('dev', compilation => {
    compilation.errors.push(new WebpackError('foo'));
  });
  await expect(webpackBuild(compiler)).rejects.toThrow();
  expect(output.toString()).toMatchInlineSnapshot(`
    "[41m[1m ERROR [22m[49m [31m[1mError[22m[39m[90m:[39m foo
        [90mat[39m <ROOT>/tests/e2e/webpack.test.ts[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/packages/builder/builder-webpack-provider/src/core/build.ts[90m:<POS>[39m
        [90mat[39m [90m:undefined:undefined[39m
        [90mat[39m <WORKSPACE>/packages/builder/builder-webpack-provider/src/core/build.ts[90m:<POS>[39m
        [90mat[39m <ROOT>/tests/e2e/webpack.test.ts[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs[90m:<POS>[39m
        [90mat[39m async <WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/entry.mjs[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/entry.mjs[90m:<POS>[39m
        [90mat[39m async file:<WORKSPACE>/node_modules/<PNPM_INNER>/tinypool/dist/esm/worker.js[90m:<POS>[39m
    "
  `);
});

test('fixture', async () => {
  const options = await useFixture('@modern-js/e2e/fixtures/builder/basic', {
    copy: true,
  });
  const output = useOutput();
  const config: webpack.Configuration = {
    context: options.cwd,
    mode: 'production',
    entry: './index.js',
    output: {
      filename: 'main.js',
      path: options.distPath,
    },
    plugins: [new FriendlyErrorsWebpackPlugin({ output: output.handle })],
  };
  const compiler = webpack(config);
  compiler.hooks.compilation.tap('dev', () => {
    throw new Error('bar');
  });
  await webpackBuild(compiler).catch(e =>
    outputPrettyError(e, { output: output.handle }),
  );
  expect(output.toString()).toMatchInlineSnapshot(`
    "[41m[1m ERROR [22m[49m [31m[1mError[22m[39m[90m:[39m bar
        [90mat[39m <ROOT>/tests/e2e/webpack.test.ts[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/packages/builder/builder-webpack-provider/src/core/build.ts[90m:<POS>[39m
        [90mat[39m [90m:undefined:undefined[39m
        [90mat[39m <WORKSPACE>/packages/builder/builder-webpack-provider/src/core/build.ts[90m:<POS>[39m
        [90mat[39m <ROOT>/tests/e2e/webpack.test.ts[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs[90m:<POS>[39m
        [90mat[39m async <WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/entry.mjs[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs[90m:<POS>[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/entry.mjs[90m:<POS>[39m
        [90mat[39m async file:<WORKSPACE>/node_modules/<PNPM_INNER>/tinypool/dist/esm/worker.js[90m:<POS>[39m
    "
  `);
});
