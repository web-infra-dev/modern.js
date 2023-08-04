import { expect, getLibuilderTest } from '@/toolkit';

describe('fixture:css-entry', () => {
  it('env', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        a: './a.ts',
        'a-b': './a-b.ts',
      },
    });
    await bundler.build();
    expect(bundler.outputChunk.get(require.resolve('./dist/a.css'))?.entryPoint).to.be.equal(require.resolve('./a.ts'));
    expect(bundler.outputChunk.get(require.resolve('./dist/a-b.css'))?.entryPoint).to.be.equal(
      require.resolve('./a-b.ts')
    );
  });
});
