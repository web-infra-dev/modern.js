import fs from 'fs';
import path from 'path';
import { expect, getLibuilderTest, ILibuilderTest } from '@/toolkit';

describe.skip('fixture:watch', function () {
  const root = __dirname;
  let bundler: ILibuilderTest;
  before(async () => {
    bundler = await getLibuilderTest({
      root,
      watch: true,
    });
    await bundler.build();
  });

  it('should not bundle when encounter error', async () => {
    const watchFile = path.resolve(root, './index.ts');
    const content = `let let`;

    await bundler.testRebuild(watchFile, content).catch(() => {
      expect(Object.values(bundler.getJSOutput()).length).equal(0);
    });

    await bundler.testRebuild(watchFile, 'console.log()');
  });

  after(async () => {
    const watchFile = path.resolve(root, './index.ts');
    fs.writeFileSync(watchFile, '');
    await bundler.close();
  });
});
