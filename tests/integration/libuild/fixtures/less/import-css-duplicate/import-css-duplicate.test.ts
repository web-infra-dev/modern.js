import { getLibuilderTest } from '@/toolkit';

describe('fixture:less_import_css_duplicate', function () {
  it('import css in less duplicate test', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
    });
    await bundler.build();
    bundler.expectCSSOutputMatchSnapshot();
  });

  it('import css in less duplicate test', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      style: {
        cleanCss: true,
      },
    });
    await bundler.build();
    bundler.expectCSSOutputMatchSnapshot();
  });
});
