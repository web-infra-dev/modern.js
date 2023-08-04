import { getLibuilderTest } from '@/toolkit';

describe('resolve:condition mainFields', () => {
  it('basic', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      resolve: {
        mainFields: ['source', 'module', 'browser', 'main'],
      },
    });
    await bundler.build();
    bundler.expectJSOutputMatchSnapshot();
  });
});
