import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from '../../../utils';

initBeforeTest();

describe('style', () => {
  const fixtureDir = __dirname;
  it('inject and modules and autoModules usage', async () => {
    await runCli({
      argv: ['build'],
      appDirectory: fixtureDir,
    });

    const content = await fs.readFile(
      path.join(fixtureDir, './dist/index.js'),
      'utf8',
    );
    expect(
      content.includes('contentWrapper') && content.includes('styleInject'),
    ).toBeTruthy();
  });
});
