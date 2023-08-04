import { expect, getLibuilderTest } from '@/toolkit';

describe('input ignore .d.ts files', () => {
  it('input only have a.ts file', async () => {
    const PATH = 'test_output_path';
    const root = __dirname;
    const bundler = await getLibuilderTest({
      root,
      bundle: false,
      input: ['./src/a.ts', './src/b.d.ts'],
      outdir: PATH,
    });

    expect(bundler.config.input).deep.equal(['./src/a.ts']);
  });
});
