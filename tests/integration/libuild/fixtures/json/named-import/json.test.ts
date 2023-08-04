import { expect, getLibuilderTest } from '@/toolkit';

describe('fixture:json', function () {
  it("import named export will shaking other that don't import", async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        main: 'index.js',
      },
    });
    await bundler.build();
    const jsOutput = bundler.getJSOutput();
    const jsChunk = Object.values(jsOutput);
    expect(jsChunk.length === 1).to.be.true;
    expect(jsChunk[0].contents.includes('你好')).to.be.true;
    expect(jsChunk[0].contents.includes('描述内容')).to.be.false;
    expect(jsChunk[0].contents.includes('1.0.0')).to.be.false;
  });
});
