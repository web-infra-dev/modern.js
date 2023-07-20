import path from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';
import { webpackOnlyTest } from '../../../scripts/helper';

webpackOnlyTest(
  'should compile CSS modules which depends on importLoaders correctly',
  async () => {
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

    expect(content).toEqual(
      '.class-foo-yQ8Tl7+.hello-class-foo{background-color:red}.class-bar-TVH2T6 .hello-class-bar{background-color:blue}',
    );
  },
);
