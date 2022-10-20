import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';
import { expect, it } from 'vitest';
import { useFixture } from '../src';

it('fixture', async () => {
  const options = await useFixture('./fixtures/basic'); // also can be `@modern-js/e2e/fixtures/basic`
  const builder = await createStubBuilder({
    ...options,
    plugins: 'minimal',
  });
  const files = await builder.unwrapOutputJSON();
  expect(Object.keys(files)).toMatchInlineSnapshot(`
    [
      "<TEMP>/modern-js/stub-builder/dist/<FRAGMENT>/static/js/main.js",
      "<TEMP>/modern-js/stub-builder/dist/<FRAGMENT>/static/js/main.js.map",
    ]
  `);
});
