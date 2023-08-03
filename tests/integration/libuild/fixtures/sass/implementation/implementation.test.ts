import { getLibuilderTest } from '@/toolkit';

describe('fixture:sass', function () {
  it('implemention object', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        basic: './basic.scss',
      },
      style: {
        sass: {
          implementation: require('sass'),
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
        basic: './basic.scss',
      },
      style: {
        sass: {
          implementation: require.resolve('sass'),
        },
      },
    });
    await bundler.build();
    bundler.expectCSSOutputMatchSnapshot();
  });
});
