import { expect, getLibuilderTest } from '@/toolkit';

describe('fixture:input', () => {
  it('array input', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: ['./index.ts'],
    });
    await bundler.build();
    const jsOutput = bundler.getJSOutput();
    const values = Object.values(jsOutput);
    expect(values.length === 1).to.be.true;
  });
});
