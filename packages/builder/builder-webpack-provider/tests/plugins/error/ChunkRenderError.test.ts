import assert from 'assert';
import { useFixture } from '@modern-js/e2e';
import { expect, test } from 'vitest';
import { Chunk } from 'webpack';
import ChunkRenderError from 'webpack/lib/ChunkRenderError';
import {
  baseFormatter,
  prettyFormatter,
} from '@modern-js/friendly-errors-webpack-plugin/formatter';
import { parseError } from '@modern-js/friendly-errors-webpack-plugin/shared/utils';
import { flattenErrorCauses } from '@modern-js/friendly-errors-webpack-plugin/transformer';
import { createStubBuilder } from '@/stub';

test('ChunkRenderError', async () => {
  const options = await useFixture('@modern-js/e2e/fixtures/builder/basic');
  const builder = await createStubBuilder({
    ...options,
    plugins: 'minimal',
  });
  const [{ stats }] = await builder.unwrapHook('onAfterBuildHook');
  assert(stats && 'compilation' in stats);
  const chunk = new Chunk('foo');
  const error = new ChunkRenderError(
    chunk,
    stats.compilation,
    new Error('foo'),
  );
  const parsed = parseError(error);
  expect(baseFormatter(parsed)).toMatchInlineSnapshot(`
    "/chunkrendererror foo
        at <ROOT>/tests/plugins/error/ChunkRenderError.test.ts:<POS>
        at async runTest (<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)
        at async runSuite (<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)
        at async runFiles (<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)
        at async startTestsNode (<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)
        at async <WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/entry.mjs:<POS>
        at async Module.withEnv (<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)
        at async run (<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/entry.mjs:<POS>)
        at async file:<WORKSPACE>/node_modules/<PNPM_INNER>/tinypool/dist/esm/worker.js:<POS>
    Error: foo
        at <ROOT>/tests/plugins/error/ChunkRenderError.test.ts:<POS>
        at async runTest (<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)
        at async runSuite (<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)
        at async runFiles (<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)
        at async startTestsNode (<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)
        at async <WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/entry.mjs:<POS>
        at async Module.withEnv (<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)
        at async run (<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/entry.mjs:<POS>)
        at async file:<WORKSPACE>/node_modules/<PNPM_INNER>/tinypool/dist/esm/worker.js:99:20"
  `);
  expect(prettyFormatter(flattenErrorCauses(parsed)!)).toMatchInlineSnapshot(`
    "[41m[1m ERROR [22m[49m [31m[1mChunkRenderError[22m[39m[90m:[39m foo
        [90mat[39m [90m<ROOT>/tests/plugins/error/ChunkRenderError.test.ts:<POS>[39m
        [90mat[39m [90m<ROOT>/tests/plugins/error/ChunkRenderError.test.ts:<POS>[39m
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
