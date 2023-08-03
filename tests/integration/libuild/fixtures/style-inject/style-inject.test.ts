import { expect, getLibuilderTest } from '@/toolkit';

describe('fixture:style-inject', () => {
  it('inject css to js', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        index: './inject.tsx',
      },
      style: {
        inject: true,
      },
    });
    await bundler.build();
    const jsOutput = bundler.getJSOutput();
    const jsChunk = Object.values(jsOutput);
    expect(jsChunk.length === 1).to.be.true;
    expect(jsChunk[0].contents.includes('blue')).to.be.true;
    expect(Object.values(bundler.getCSSOutput).length === 0).to.be.true;
  });
});
