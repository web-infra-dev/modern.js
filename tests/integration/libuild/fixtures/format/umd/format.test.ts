import { getLibuilderTest } from '@/toolkit';
import { umdPlugin } from '@modern-js/libuild-plugin-swc';

describe('fixture:format:umd', () => {
  it('format umd', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      format: 'umd',
      splitting: true,
      plugins: [umdPlugin()],
    });
    await bundler.build();

    bundler.expectJSOutputMatchSnapshot();
  });
});
