import { getLibuilderTest } from '@/toolkit';

describe('fixture:format:iife', () => {
  it('format iife', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      format: 'iife',
    });
    await bundler.build();

    bundler.expectJSOutputMatchSnapshot();

    const bundler2 = await getLibuilderTest({
      root: __dirname,
      format: 'iife',
      sourceMap: true,
    });
    await bundler2.build();

    bundler.expectJSOutputMatchSnapshot();
  });
});
