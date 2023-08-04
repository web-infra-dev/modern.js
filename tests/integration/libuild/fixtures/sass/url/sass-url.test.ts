import { getLibuilderTest } from '@/toolkit';

describe('fixture:sass', function () {
  it('sass-url', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        import: './index.scss',
      },
    });
    await bundler.build();
    bundler.expectCSSOutputMatchSnapshot();
  });
});
