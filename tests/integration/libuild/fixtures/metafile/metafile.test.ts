import fs from 'fs';
import path from 'path';
import { expect, getLibuilderTest } from '@/toolkit';

describe('fixture:metafile', function () {
  it('should work', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      metafile: true,
    });
    await bundler.build();
    const hasMetaFile =
      fs.readdirSync(path.resolve(__dirname, './dist')).filter((name) => name.startsWith('metafile')).length > 0;
    expect(hasMetaFile).to.be.true;
  });
});
