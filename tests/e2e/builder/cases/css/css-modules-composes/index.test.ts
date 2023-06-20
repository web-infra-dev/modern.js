import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';

test('should compile CSS modules composes correctly', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
  });
  const files = await builder.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find(file => file.endsWith('.css'))!];

  if (builder.providerType === 'rspack') {
    expect(content).toMatch(
      /.*\{background:red;color:yellow\}.*\{background:blue\}/,
    );
  } else {
    expect(content).toMatch(
      /.*\{background:red;color:#ff0\}.*\{background:blue\}/,
    );
  }
});

test('should compile CSS modules composes with external correctly', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { external: path.resolve(__dirname, './src/external.js') },
  });
  const files = await builder.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find(file => file.endsWith('.css'))!];

  if (builder.providerType === 'rspack') {
    expect(content).toMatch(
      /.*\{background:cyan;color:black\}.*\{background:green\}/,
    );
  } else {
    expect(content).toMatch(
      /.*\{background:cyan;color:#000\}.*\{background:green\}/,
    );
  }
});
