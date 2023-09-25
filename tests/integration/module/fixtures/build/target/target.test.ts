import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from '../../utils';

initBeforeTest();

describe('target usage', () => {
  const fixtureDir = __dirname;
  it('target is es5', async () => {
    const configFile = 'es5.config.ts';
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    const distFilePath = path.join(fixtureDir, './dist/index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(content.includes(`function(`)).toBeTruthy();
  });
});
