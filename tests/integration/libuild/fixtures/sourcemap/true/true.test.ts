import fs from 'fs';
import { expect, getLibuilderTest } from '@/toolkit';

describe('fixture:sourcemap', () => {
  it('should work when sourcemap is `true`', async () => {
    const bundler = await getLibuilderTest({ root: __dirname, sourceMap: true });
    await bundler.build();

    const jsOutput = bundler.getJSOutput();
    const jsChunk = Object.entries(jsOutput);
    expect(jsChunk.length).equal(1);
    const outputFile = jsChunk[0][0];
    const outputMapFile = `${outputFile}.map`;
    expect(fs.existsSync(outputMapFile)).to.be.true;
    expect(fs.readFileSync(outputFile).toString('utf-8')).include('sourceMappingURL');
  });
});
