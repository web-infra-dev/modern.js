import { getLibuilderTest } from '@/toolkit';

describe('fixture:format:cjs', () => {
  it('format cjs', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      format: 'cjs',
    });
    await bundler.build();

    bundler.expectJSOutputMatchSnapshot();

    const bundler2 = await getLibuilderTest({
      root: __dirname,
      format: 'cjs',
      sourceMap: true,
    });
    await bundler2.build();

    bundler.expectJSOutputMatchSnapshot();
  });
});
