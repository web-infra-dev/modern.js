import { getLibuilderTest } from '@/toolkit';
import { es5Plugin } from '@modern-js/libuild-plugin-swc';

describe('fixture:target', () => {
  it('es2015', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      target: 'es2015',
      input: {
        es2015: './index.ts',
      },
    });
    await bundler.build();
    bundler.expectJSOutputMatchSnapshot();
  });
  it('es2017', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        es2017: './index.ts',
      },
      target: 'es2017',
    });
    await bundler.build();
    bundler.expectJSOutputMatchSnapshot();
  });
  it('es5', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        es5: './index.ts',
      },
      plugins: [es5Plugin()],
      target: 'es5',
      bundle: false,
    });
    await bundler.build();
    bundler.expectJSOutputMatchSnapshot();
  });
});
