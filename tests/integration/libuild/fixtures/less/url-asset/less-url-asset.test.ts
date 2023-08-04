import { getLibuilderTest } from '@/toolkit';

describe('fixture:less', function () {
  it('should work with url assets', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
    });
    await bundler.build();
    bundler.expectCSSOutputMatchSnapshot();
  });
});
