import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';

test('should compile CSS modules correctly', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    builderConfig: {
      output: {
        disableSourceMap: true,
      },
    },
  });
  const files = await builder.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find(file => file.endsWith('.css'))!];

  if (builder.providerType === 'rspack') {
    expect(content).toEqual(
      '.the-a-class{color:red}.EKP4e{color:blue}.D9ohp{color:yellow}.the-d-class{color:green}',
    );
  } else {
    expect(content).toEqual(
      '.the-a-class{color:red}._HnKp{color:blue}.e94QZ{color:#ff0}.the-d-class{color:green}',
    );
  }
});

test('should treat normal CSS as CSS modules when disableCssModuleExtension is true', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
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

  if (builder.providerType === 'rspack') {
    expect(content).toEqual(
      '.vTgro{color:red}.EKP4e{color:blue}.D9ohp{color:yellow}.the-d-class{color:green}',
    );
  } else {
    expect(content).toEqual(
      '.azoWc{color:red}._HnKp{color:blue}.e94QZ{color:#ff0}.the-d-class{color:green}',
    );
  }
});
