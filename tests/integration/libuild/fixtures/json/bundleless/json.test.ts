import { expect, getLibuilderTest } from '@/toolkit';

describe('fixture:json', function () {
  it('import default will bundle all json data', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      bundle: false,
      input: {
        main: 'index.js',
      },
    });
    await bundler.build();
    const jsOutput = bundler.getJSOutput();
    const jsChunk = Object.values(jsOutput);
    expect(jsChunk.length === 1).to.be.true;
    expect(jsChunk[0].contents.includes('json')).to.be.true;
  });
});
