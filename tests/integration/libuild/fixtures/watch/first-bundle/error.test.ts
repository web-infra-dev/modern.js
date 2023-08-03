import fs from 'fs';
import path from 'path';
import { expect, getLibuilderTest, ILibuilderTest } from '@/toolkit';

describe.skip('fixture:watch', function () {
  const root = __dirname;
  const watchFile = path.resolve(root, './index.ts');

  let bundler: ILibuilderTest | null;

  before(async () => {
    fs.writeFileSync(watchFile, '/');
  });

  it('watch mode should not stop when first bundle error', async () => {
    fs.writeFileSync(watchFile, '/');

    bundler = await getLibuilderTest({
      root,
      logLevel: 'silent',
      watch: true,
    });

    await bundler.build().catch((err) => {
      expect(Object.values(bundler!.getJSOutput()).length).equal(0);
      expect(err.errors.length).equal(1);
    });

    await bundler.testRebuild(watchFile, 'console.log()');
    expect(Object.values(bundler.getJSOutput())[0].contents).includes('console.log();');
  });

  it('watch mode should not stop when transform throw error', async () => {
    bundler = await getLibuilderTest({
      root,
      logLevel: 'silent',
      watch: true,
      plugins: [
        {
          name: 'test',
          apply(compiler) {
            compiler.hooks.transform.tapPromise('test', async (source) => {
              if (source.code === '/') {
                throw new Error('Transform Error');
              }

              return source;
            });
          },
        },
      ],
    });

    await bundler.build().catch((err) => {
      expect(Object.values(bundler!.getJSOutput()).length).equal(0);
      expect(err.errors.length).equal(1);
    });

    await bundler.testRebuild(watchFile, 'console.log()');
    expect(Object.values(bundler.getJSOutput())[0].contents).includes('console.log();');
  });

  after(async () => {
    fs.writeFileSync(watchFile, '');
    await bundler?.close();
    bundler = null;
  });
});
