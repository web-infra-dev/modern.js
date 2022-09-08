import { createStubBuilder } from '@modern-js/webpack-builder/stub';
import { expect, test } from '@modern-js/e2e/playwright';

test('basic', async ({ page }) => {
  const builder = createStubBuilder({ webpack: true });
  await builder.build();
  await page.goto('http://localhost:3000');

  expect(await page.evaluate('window.answer')).toBe(42);
});
