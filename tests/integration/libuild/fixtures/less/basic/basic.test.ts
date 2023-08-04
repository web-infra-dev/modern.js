import { getLibuilderTest } from '@/toolkit';

describe('fixture:less', function () {
  it('basic example should bundle', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        basic: './basic.less',
      },
    });
    await bundler.build();
    bundler.expectCSSOutputMatchSnapshot();
  });
});
