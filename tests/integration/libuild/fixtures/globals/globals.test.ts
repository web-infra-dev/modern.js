import { getLibuilderTest } from '@/toolkit';

describe('fixture:globals', () => {
  it('basic', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      external: ['react'],
      globals: {
        react: 'React',
      },
    });
    await bundler.build();

    bundler.expectJSOutputMatchSnapshot();
  });
});
