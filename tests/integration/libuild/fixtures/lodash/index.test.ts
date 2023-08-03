import { getLibuilderTest, expect } from '@/toolkit';
import { swcTransformPlugin } from '@modern-js/libuild-plugin-swc';

describe('fixture:lodash', () => {
  it('should transform lodash imports by default', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      bundle: false,
      plugins: [swcTransformPlugin({ externalHelpers: true })],
      input: ['./src'],
    });
    await bundler.build();
    const jsOutput = bundler.getJSOutput();
    Object.entries(jsOutput).map(([path, chunk]) => {
      expect(chunk.contents.includes('import _lodash_map3 from "lodash-es/map"')).to.be.true;
      expect(chunk.contents.includes('import _lodash_map2 from "lodash/map"')).to.be.true;
      expect(chunk.contents.includes('import addEs from "lodash-es/add"')).to.be.true;
      expect(chunk.contents.includes('import add from "lodash/add"')).to.be.true;
    });
  });
});
