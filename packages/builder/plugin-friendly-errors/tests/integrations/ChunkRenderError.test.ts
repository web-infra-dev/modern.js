import assert from 'assert';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';
import { useFixture } from '@modern-js/e2e';
import { test } from 'vitest';
import { Chunk } from 'webpack';
import ChunkRenderError from 'webpack/lib/ChunkRenderError';
import { baseFormatter, prettyFormatter } from '@/formatter';
import { transformConnectAttachedHead } from '@/transformer';
import { parseError } from '@/shared/utils';

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
  console.log(baseFormatter(parsed));
  transformConnectAttachedHead(parsed);
  console.log(prettyFormatter(parsed));
});
