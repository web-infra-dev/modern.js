import { resolve } from 'path';
import { expect, getLibuilderTest } from '@/toolkit';

describe('config:merge', () => {
  it('should merge params and configFile', async () => {
    // params should have a higher priority.
    const PATH = 'test_output_path';
    const root = __dirname;
    const bundler = await getLibuilderTest({
      root,
      input: {
        a: './a2.js',
        c: 'c.js',
      },
      outdir: PATH,
    });
    expect(bundler.config.input).deep.equal({
      a: resolve(root, './a2.js'),
      b: resolve(__dirname, './b.js'),
      c: resolve(root, './c.js'),
    });
    expect(bundler.config.outdir).include(PATH);
    expect(bundler.config.watch).equal(false);
  });
});
