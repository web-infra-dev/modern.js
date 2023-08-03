import { expect, getLibuilderTest } from '@/toolkit';

describe('fixture:minify', () => {
  it('when `minify` is `esbuild`', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      minify: 'esbuild',
    });
    await bundler.build();
    const jsOutput = bundler.getJSOutput();
    const jsChunk = Object.values(jsOutput);
    expect(jsChunk.length === 1).to.be.true;
    expect(jsChunk[0].contents).toMatchSnapshot();
  });
});
