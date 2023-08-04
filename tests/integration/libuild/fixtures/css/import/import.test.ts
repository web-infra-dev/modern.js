import { expect, getLibuilderTest } from '@/toolkit';

describe('fixture:css', () => {
  it('import:enhanced', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        import: 'import.css',
      },
    });
    await bundler.build();
    // css
    const cssOutput = bundler.getCSSOutput();
    const cssChunk = Object.values(cssOutput);
    expect(cssChunk.length === 1).to.true;
    expect(cssChunk[0].contents.toString()).toMatchSnapshot();
  });
});
