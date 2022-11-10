import assert from 'assert';
import { PluginSass } from '@modern-js/builder-webpack-provider/plugins/sass';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';
import { useFixture } from '@modern-js/e2e';
import { test } from 'vitest';

test.skip('Circular', async () => {
  const options = await useFixture(
    '@modern-js/e2e/fixtures/builder/circular-dep',
  );
  const builder = await createStubBuilder({
    ...options,
    plugins: {
      builtin: 'minimal',
      additional: [PluginSass()],
    },
  });
  const [{ stats }] = await builder.unwrapHook('onAfterBuildHook');
  assert(stats && 'compilation' in stats);
  stats.compilation.errors.forEach(error => console.error(error));
}, 0);
