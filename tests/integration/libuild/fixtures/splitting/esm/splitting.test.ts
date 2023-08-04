import { getLibuilderTest } from '@/toolkit';

describe('fixture:splitting', () => {
  it('esm', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      format: 'esm',
      splitting: true,
    });
    await bundler.build();
    bundler.expectJSOutputMatchSnapshot();
  });
});
