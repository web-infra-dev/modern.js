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
      '.yQ8Tl+.hello-class-foo{background-color:red}.TVH2T .hello-class-bar{background-color:blue}',
    );
  },
);
