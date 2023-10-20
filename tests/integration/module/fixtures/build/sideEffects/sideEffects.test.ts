import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from '../../utils';

initBeforeTest();

describe('sideEffects', () => {
  const fixtureDir = __dirname;
  it('base usage', async () => {
    await runCli({
      argv: ['build'],
      appDirectory: fixtureDir,
    });
    const distIndexPath = path.join(fixtureDir, './dist/index.js');
    expect(
      (await fs.readFile(distIndexPath, 'utf-8')).length === 0,
    ).toBeTruthy();
    const distLibPath = path.join(fixtureDir, './dist/index.js');
    expect((await fs.readFile(distLibPath, 'utf-8')).length === 0).toBeTruthy();
  });
});
