import { getLibuilderTest } from '@/toolkit';

describe('fixture:less', function () {
  it('should work with @import', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      resolve: {
        preferRelative: true,
      },
    });
    await bundler.build();
    bundler.expectCSSOutputMatchSnapshot();
  });
});
