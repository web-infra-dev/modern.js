import { getLibuilderTest } from '@/toolkit';

describe('resolve:condition exports', () => {
  it('basic:node', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      platform: 'node',
      input: {
        entry1: './entry1.ts',
        entry2: './entry2.ts',
        entry3: './entry3.ts',
        entry4: './entry4.ts',
      },
    });
    await bundler.build();
    bundler.expectJSOutputMatchSnapshot();
  });
  it('basic:browser', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      platform: 'browser',
      input: {
        entry1: './entry1.ts',
        entry2: './entry2.ts',
        entry3: './entry3.ts',
        entry4: './entry4.ts',
      },
    });
    await bundler.build();
    bundler.expectJSOutputMatchSnapshot();
  });
});
