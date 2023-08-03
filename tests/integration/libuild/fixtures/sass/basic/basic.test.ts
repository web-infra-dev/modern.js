import { getLibuilderTest } from '@/toolkit';

describe('fixture:sass', function () {
  it('basic example should bundle', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        basic: './basic.scss',
      },
    });
    await bundler.build();
    bundler.expectCSSOutputMatchSnapshot();
  });
});
