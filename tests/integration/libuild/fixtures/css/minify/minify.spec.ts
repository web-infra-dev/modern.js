import { expect, getLibuilderTest } from '@/toolkit';

describe('css:minify', function () {
  it('minify', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        main1: './index.css',
      },
      style: {
        cleanCss: true,
      },
    });
    await bundler.build();
    const cssOutput = bundler.getCSSOutput();
    const cssChunk = Object.values(cssOutput);
    expect(cssChunk.length === 1).to.true;
    expect(cssChunk[0].contents).not.include('\n');
  });

  it('minify-custom-option', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        main2: './index.css',
      },
      style: {
        cleanCss: { level: { 2: { overrideProperties: false } } },
      },
    });
    await bundler.build();
    const cssOutput = bundler.getCSSOutput();
    const cssChunk = Object.values(cssOutput);
    expect(cssChunk.length === 1).to.true;
    expect(cssChunk[0].contents.toString().split('bottom').length - 1 === 3).to.true;
  });
});
