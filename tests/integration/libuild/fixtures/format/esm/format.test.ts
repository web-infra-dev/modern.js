import { getLibuilderTest } from '@/toolkit';

describe('fixture:format:esm', () => {
  it('format esm', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      format: 'esm',
    });
    await bundler.build();

    bundler.expectJSOutputMatchSnapshot();

    const bundler2 = await getLibuilderTest({
      root: __dirname,
      format: 'esm',
      sourceMap: true,
    });
    await bundler2.build();

    bundler.expectJSOutputMatchSnapshot();
  });
});
