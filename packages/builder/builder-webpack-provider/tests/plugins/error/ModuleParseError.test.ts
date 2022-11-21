import assert from 'assert';
import ModuleParseError from 'webpack/lib/ModuleParseError';
import { useFixture } from '@modern-js/e2e';
import { expect, test } from 'vitest';
import {
  baseFormatter,
  prettyFormatter,
} from '@modern-js/friendly-errors-webpack-plugin/formatter';
import { parseError } from '@modern-js/friendly-errors-webpack-plugin/shared/utils';
import { transformModuleParseError } from '@modern-js/friendly-errors-webpack-plugin/transformer';
import { createStubBuilder } from '@/stub';

test('MissingLoader', async () => {
  const options = await useFixture('@modern-js/e2e/fixtures/builder/basic');
  const builder = await createStubBuilder({
    ...options,
    plugins: 'minimal',
  });
  const [{ stats }] = await builder.unwrapHook('onAfterBuildHook');
  assert(stats && 'compilation' in stats);
  const source = [
    'import { FC } from "react";',
    'export const Foo: FC = () => <div>foo</div>;',
  ].join('\n');
  const rawError = new Error('foo');
  const error = new ModuleParseError(
    source,
    rawError,
    ['bar-loader', 'foo-loader'],
    'javascript/esm',
  );
  const parsed = parseError(error);
  expect(baseFormatter(parsed)).toMatchInlineSnapshot(`
    "/moduleparseerror Module parse failed: foo
    File was processed with these loaders:
     * bar-loader
     * foo-loader
    You may need an additional loader to handle the result of these loaders.
    Error: foo
        at <ROOT>/tests/plugins/error/ModuleParseError.test.ts:<POS>
        at async runTest (<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)
        at async runSuite (<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)
        at async runFiles (<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)
        at async startTestsNode (<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)
        at async <WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/entry.mjs:<POS>
        at async Module.withEnv (<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)
        at async run (<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/entry.mjs:<POS>)
        at async file:<WORKSPACE>/node_modules/<PNPM_INNER>/tinypool/dist/esm/worker.js:<POS>
        at <ROOT>/tests/plugins/error/ModuleParseError.test.ts:<POS>
        at async runTest (<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)
        at async runSuite (<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)
        at async runFiles (<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)
        at async startTestsNode (<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)
        at async <WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/entry.mjs:<POS>
        at async Module.withEnv (<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)
        at async run (<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/entry.mjs:<POS>)
        at async file:<WORKSPACE>/node_modules/<PNPM_INNER>/tinypool/dist/esm/worker.js:99:20"
  `);
  transformModuleParseError(parsed);
  expect(prettyFormatter(parsed)).toMatchInlineSnapshot(`
    "[41m[1m ERROR [22m[49m [31m[1mModuleParseError[22m[39m[90m:[39m Module parse failed: foo
    File was processed with these loaders:
     * bar-loader
     * foo-loader
    You may need an additional loader to handle the result of these loaders. You can try to fix it by:
     [90m*[39m Check if the file is valid.
     [90m*[39m Enable relational config of \`tools\`: https:/modernjs.dev/builder/en/api/config-tools.html
     [90m*[39m Install builder plugins: https:/modernjs.dev/builder/en/plugin
    Or you can try to configure bundler loaders manually.
        [90mat[39m [90m<ROOT>/tests/plugins/error/ModuleParseError.test.ts:<POS>[39m
        [90mat[39m async runTest [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
        [90mat[39m async runSuite [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
        [90mat[39m async runFiles [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
        [90mat[39m async startTestsNode [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
        [90mat[39m [90masync <WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/entry.mjs:<POS>[39m
        [90mat[39m async Module.withEnv [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
        [90mat[39m async run [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/entry.mjs:<POS>)[39m
        [90mat[39m [90masync file:<WORKSPACE>/node_modules/<PNPM_INNER>/tinypool/dist/esm/worker.js:<POS>[39m
    [41m[1m CAUSE [22m[49m [31m[1mError[22m[39m[90m:[39m foo
        [90mat[39m [90m<ROOT>/tests/plugins/error/ModuleParseError.test.ts:<POS>[39m
        [90mat[39m async runTest [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
        [90mat[39m async runSuite [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
        [90mat[39m async runFiles [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
        [90mat[39m async startTestsNode [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
        [90mat[39m [90masync <WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/entry.mjs:<POS>[39m
        [90mat[39m async Module.withEnv [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
        [90mat[39m async run [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/entry.mjs:<POS>)[39m
        [90mat[39m [90masync file:<WORKSPACE>/node_modules/<PNPM_INNER>/tinypool/dist/esm/worker.js:<POS>[39m"
  `);
});
