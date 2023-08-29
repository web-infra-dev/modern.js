import { expect, getLibuilderTest } from '@/toolkit';
import { babelPlugin } from '@modern-js/libuild-plugin-babel';

describe('fixture:plugin:babel', function () {
  it('plugin:babel', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      plugins: [
        babelPlugin({
          presets: [['@babel/preset-env']],
        }),
      ],
    });
    await bundler.build();

    const jsOutput = Object.values(bundler.getJSOutput());
    expect(jsOutput[0].contents).toMatchSnapshot();
  });
});
