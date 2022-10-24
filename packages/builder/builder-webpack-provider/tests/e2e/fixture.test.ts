import { expect, it } from 'vitest';
import { useFixture } from '@modern-js/e2e';
import { createStubBuilder } from '../../src/stub';

it('fixture', async () => {
  const options = await useFixture('@modern-js/e2e/fixtures/builder/basic'); // also can be relative path
  const builder = await createStubBuilder({
    ...options,
    plugins: 'minimal', // no need to set in e2e environment.
  });
  const files = await builder.unwrapOutputJSON();
  expect(Object.keys(files)).toMatchInlineSnapshot(`
    [
      "<TEMP>/<FRAGMENT>/static/js/main.js",
      "<TEMP>/<FRAGMENT>/static/js/main.js.map",
    ]
  `);
});
