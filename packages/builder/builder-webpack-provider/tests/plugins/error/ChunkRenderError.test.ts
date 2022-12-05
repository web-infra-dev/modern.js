import os from 'os';
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

test.skipIf(os.platform() === 'win32')('ChunkRenderError', async () => {
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
        at Generator.next (<anonymous>)
        at fulfilled (<ROOT>/tests/plugins/error/ChunkRenderError.test.ts:<POS>)
    Error: foo
        at <ROOT>/tests/plugins/error/ChunkRenderError.test.ts:<POS>
        at Generator.next (<anonymous>)
        at fulfilled (<ROOT>/tests/plugins/error/ChunkRenderError.test.ts:<POS>)"
  `);
  expect(prettyFormatter(flattenErrorCauses(parsed)!)).toMatchInlineSnapshot(`
    "[41m[1m ERROR [22m[49m [31m[1mChunkRenderError[22m[39m[90m:[39m foo
    Error: foo
        at <ROOT>/tests/plugins/error/ChunkRenderError.test.ts:<POS>
        at Generator.next (<anonymous>)
        at fulfilled (<ROOT>/tests/plugins/error/ChunkRenderError.test.ts:<POS>)
        [90mat[39m [90m<ROOT>/tests/plugins/error/ChunkRenderError.test.ts:<POS>[39m
        [90mat[39m [90m<ROOT>/tests/plugins/error/ChunkRenderError.test.ts:<POS>[39m
        [90mat[39m Generator.next [90m(<anonymous>)[39m
        [90mat[39m fulfilled [90m(<ROOT>/tests/plugins/error/ChunkRenderError.test.ts:<POS>)[39m"
  `);
});
