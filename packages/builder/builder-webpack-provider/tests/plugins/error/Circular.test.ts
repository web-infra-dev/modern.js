import assert from 'assert';
import { test } from 'vitest';
import { useFixture } from '@modern-js/e2e';
import { PluginSass } from '@/plugins/sass';
import { createStubBuilder } from '@/stub';

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
