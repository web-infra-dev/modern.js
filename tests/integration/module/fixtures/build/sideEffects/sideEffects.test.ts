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
    expect(await fs.pathExists(distIndexPath)).toBeTruthy();
    expect(
      (await fs.readFile(distIndexPath, 'utf-8')).length === 0,
    ).toBeTruthy();
  });
});
