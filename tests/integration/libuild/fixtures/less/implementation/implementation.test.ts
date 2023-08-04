import { getLibuilderTest } from '@/toolkit';

describe('fixture:less', function () {
  it('implemention object', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        basic: './basic.less',
      },
      style: {
        less: {
          implementation: require('less'),
        },
      },
    });
    await bundler.build();
    bundler.expectCSSOutputMatchSnapshot();
  });
  it('implemention string', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        basic: './basic.less',
      },
      style: {
        less: {
          implementation: require.resolve('less'),
        },
      },
    });
    await bundler.build();
    bundler.expectCSSOutputMatchSnapshot();
  });
});
