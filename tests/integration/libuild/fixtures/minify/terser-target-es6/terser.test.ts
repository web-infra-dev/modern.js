import { expect, getLibuilderTest } from '@/toolkit';

describe('fixture:minify', () => {
  it('when `minify` is `terser`', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      target: 'es6',
      minify: 'terser',

    });
    await bundler.build();
    const jsOutput = bundler.getJSOutput();
    const jsChunk = Object.values(jsOutput);
    expect(jsChunk.length === 1).to.be.true;
    expect(jsChunk[0].contents).toMatchSnapshot();
  });
});
