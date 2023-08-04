import { getLibuilderTest } from '@/toolkit';

describe('fixture:sass', function () {
  it('@import should work', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        import: './import.scss',
      },
    });
    await bundler.build();
    bundler.expectCSSOutputMatchSnapshot();
  });
});
