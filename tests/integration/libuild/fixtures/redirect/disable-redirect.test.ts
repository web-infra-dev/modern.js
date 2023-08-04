import { getLibuilderTest, expect } from '@/toolkit';

describe('fixture:redirect', () => {
  it('redirect', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      resolve: {
        alias: {
          '@': 'src',
        },
      },
      redirect: {
        alias: false,
        style: false,
        asset: false,
      },
      outdir: 'dist/disable',
      bundle: false,
      input: ['./src/*.ts'],
    });
    await bundler.build();
    const jsOutput = bundler.getJSOutput();
    Object.entries(jsOutput).map(([path, chunk]) => {
      expect(chunk.contents.includes('import a from "@/style.module.less"')).to.be.true;
      expect(chunk.contents.includes('import b from "@/logo.svg"')).to.be.true;
      expect(chunk.contents.includes('import "antd/dist/antd.less"')).to.be.true;
    });
  });
});
