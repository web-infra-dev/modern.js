import { expect, getLibuilderTest } from '@/toolkit';

describe('fixture:input', () => {
  it('empty input', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {},
    });
    await bundler.build();
    const jsOutput = bundler.getJSOutput();
    const values = Object.values(jsOutput);
    expect(values.length === 1).to.be.false;
  });
});
