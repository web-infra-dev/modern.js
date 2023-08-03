import { expect, getLibuilderTest } from '@/toolkit';

describe('fixture:no bundle', () => {
  it('no bundle', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: ['src'],
      resolve: {
        alias: {
          '@': '../../src',
        },
      },
      bundle: false,
    });
    await bundler.build();
    const jsOutput = bundler.getJSOutput();
    expect(Object.values(jsOutput).length === 2).to.be.true;
    const cssOutput = bundler.getCSSOutput();
    expect(Object.values(cssOutput).length === 2).to.be.true;
  });
});
