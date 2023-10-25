import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from '../../utils';

initBeforeTest();

describe('globals usage', () => {
  const fixtureDir = __dirname;
  it(`globals is { react: 'React' }`, async () => {
    await runCli({
      argv: ['build'],
      appDirectory: fixtureDir,
    });
    const distFilePath = path.join(fixtureDir, './dist/index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(
      content.includes(
        `(typeof globalThis !== "undefined" ? globalThis : typeof global !== "undefined" ? global : self || Function("return this")())["React"]`,
      ),
    ).toBeTruthy();
  });
});
