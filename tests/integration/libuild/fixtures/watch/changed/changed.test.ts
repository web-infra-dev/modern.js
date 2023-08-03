import fs from 'fs';
import path from 'path';
import { getLibuilderTest, ILibuilderTest } from '@/toolkit';

describe('fixture:watch', function () {
  const root = __dirname;
  let bundler: ILibuilderTest;

  before(async () => {
    bundler = await getLibuilderTest({
      root,
      watch: true,
    });
    await bundler.build();
  });

  it('should work when watch file running', async () => {
    const watchFile = path.resolve(root, './index.ts');
    await bundler.testRebuild(watchFile, 'console.log(1);');

    fs.writeFileSync(watchFile, 'console.log(2);');
    await bundler.testRebuild(watchFile, 'console.log(3);');
  });

  after(async () => {
    const watchFile = path.resolve(root, './index.ts');
    fs.writeFileSync(watchFile, '');
    await bundler.close();
  });
});
