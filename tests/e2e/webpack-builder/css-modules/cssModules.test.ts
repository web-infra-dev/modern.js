import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';

test('should compile CSS modules correctly', async () => {
  const builder = await createStubBuilder({
    webpack: true,
    entry: { index: path.resolve('./src/index.js') },
    builderConfig: {
      output: {
        disableSourceMap: true,
      },
    },
  });
  const files = await builder.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find(file => file.endsWith('.css'))!];

  expect(content).toEqual(
    '.the-a-class{color:red}._HnKp{color:blue}.e94QZ{color:#ff0}.the-d-class{color:green}',
  );
});

test('should treat normal CSS as CSS modules when disableCssModuleExtension is true', async () => {
  const builder = await createStubBuilder({
    webpack: true,
    entry: { index: path.resolve('./src/index.js') },
    builderConfig: {
      output: {
        disableSourceMap: true,
        disableCssModuleExtension: true,
      },
    },
  });
  const files = await builder.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find(file => file.endsWith('.css'))!];

  expect(content).toEqual(
    '.azoWc{color:red}._HnKp{color:blue}.e94QZ{color:#ff0}.the-d-class{color:green}',
  );
});
