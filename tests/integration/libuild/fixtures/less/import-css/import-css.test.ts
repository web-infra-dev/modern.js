import { getLibuilderTest } from '@/toolkit';

describe('fixture:less_import_css', function () {
  it('import css in less', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        main: './style/index.less',
      },
      resolve: {
        alias: {
          '~': require('path').resolve(__dirname, 'style/alias'),
        },
      },
    });
    await bundler.build();
    bundler.expectCSSOutputMatchSnapshot();
  });
});
