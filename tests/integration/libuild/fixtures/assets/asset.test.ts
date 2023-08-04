import { expect, getLibuilderTest } from '@/toolkit';

describe('fixture:assets bundle', () => {
  it('default, copy asset', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: { default: './index.ts' },
    });
    await bundler.build();
    bundler.expectJSOutputMatchSnapshot();
    const jsChunk = Object.values(bundler.getJSOutput());
    const pngChunk = Object.values(bundler.getOutputByCondition((output) => output.endsWith('.png')));
    expect(jsChunk[0].contents.includes('import')).to.be.true;
    expect(Buffer.isBuffer(pngChunk[0].contents)).to.be.true;
    expect(pngChunk[0].contents).toMatchSnapshot();
  });
  it('rebase is false, support publicPath', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      asset: {
        rebase: false,
        publicPath: 'aaa/',
      },
      input: { publicPath: './index.ts' },
    });
    await bundler.build();
    const jsOutput = bundler.getJSOutput();
    const jsChunk = Object.values(jsOutput);
    expect(jsChunk[0].contents.includes('aaa/assets')).to.be.true;
  });
  it('limit asset', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: { limit: './index.ts' },
      asset: {
        limit: 14 * 1024,
      },
    });
    await bundler.build();
    const jsOutput = bundler.getJSOutput();
    const jsChunk = Object.values(jsOutput);
    expect(jsChunk[0].contents.includes('data:image')).to.be.true;
  });
  it('css url', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: { url: './index.less' },
    });
    await bundler.build();
    const cssOutput = bundler.getCSSOutput();
    const cssChunk = Object.values(cssOutput);
    expect(cssChunk[0].contents.includes(' url(./assets/')).to.be.true;
  });
});

describe('fixture:assets no bundle', () => {
  it('default ', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: { default: './index.ts' },
      bundle: false,
      outdir: 'dist/bundleless',
      outbase: '.',
    });
    await bundler.build();
    const jsOutput = bundler.getJSOutput();
    const jsChunk = Object.values(jsOutput);
    expect(jsChunk[0].contents.includes('import svg from "./assets')).to.be.true;
  });
});
