import { getLibuilderTest } from '@/toolkit';

describe('fixture:less', function () {
  it('additionalData', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        basic: './basic.less',
      },
      style: {
        less: {
          additionalData: `@base-color: #c6538c;`,
        },
      },
    });
    await bundler.build();
    bundler.expectCSSOutputMatchSnapshot();
  });
});
