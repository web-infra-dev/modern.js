import os from 'os';
import assert from 'assert';
import { useFixture } from '@modern-js/e2e';
import { expect, test } from 'vitest';
import { Chunk, Stats } from 'webpack';
import ChunkRenderError from 'webpack/lib/ChunkRenderError';
import {
  baseFormatter,
  prettyFormatter,
} from '@modern-js/friendly-errors-webpack-plugin/formatter';
import { parseError } from '@modern-js/friendly-errors-webpack-plugin/shared/utils';
import { flattenErrorCauses } from '@modern-js/friendly-errors-webpack-plugin/transformer';
import stripAnsi from '@modern-js/utils/strip-ansi';
import { createStubBuilder } from '@/stub';

test.skipIf(os.platform() === 'win32')('ChunkRenderError', async () => {
  const options = await useFixture('@modern-js/e2e/fixtures/builder/basic');
  const builder = await createStubBuilder({
    ...options,
    plugins: 'minimal',
  });
  const [{ stats }] = await builder.unwrapHook('onAfterBuildHook');
  assert(stats instanceof Stats);
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
  expect(stripAnsi(prettyFormatter(flattenErrorCauses(parsed)!)!))
    .toMatchInlineSnapshot(`
      " ERROR  ChunkRenderError: foo
      Error: foo
          at <ROOT>/tests/plugins/error/ChunkRenderError.test.ts:<POS>
          at Generator.next (<anonymous>)
          at fulfilled (<ROOT>/tests/plugins/error/ChunkRenderError.test.ts:<POS>)
          at <ROOT>/tests/plugins/error/ChunkRenderError.test.ts:<POS>
          at <ROOT>/tests/plugins/error/ChunkRenderError.test.ts:<POS>
          at Generator.next (<anonymous>)
          at fulfilled (<ROOT>/tests/plugins/error/ChunkRenderError.test.ts:<POS>)"
    `);
});
