import { getLibuilderTest } from '@/toolkit';

describe('fixture:env', () => {
  it('env', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        main: './index.ts',
      },
    });
    await bundler.build();
    bundler.expectJSOutputMatchSnapshot();
    delete process.env.NODE_ENV;
  });
});
