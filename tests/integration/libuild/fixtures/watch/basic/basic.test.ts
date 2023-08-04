import fs from 'fs';
import path from 'path';
import { getLibuilderTest, ILibuilderTest } from '@/toolkit';

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

  it('should work when the same content is written repeatedly', async () => {
    const watchFile = path.resolve(root, './index.ts');
    for (const value of [1, 1, 1, 1, 1, 1, 1, 1]) {
      await bundler.testRebuild(watchFile, `console.log(${value});`);
    }
  });

  it('should work when repeated write multiple times', async () => {
    const watchFile = path.resolve(root, './index.ts');
    for (const value of [1, 2, 3, 4, 5, 6, 7, 8]) {
      await bundler.testRebuild(watchFile, `console.log(${value});`);
    }
  });

  after(async () => {
    const watchFile = path.resolve(root, './index.ts');
    fs.writeFileSync(watchFile, '');
    await bundler.close();
  });
});
