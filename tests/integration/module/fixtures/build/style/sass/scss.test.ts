import path from 'path';
import { fs } from '@modern-js/utils';
import { initBeforeTest, runCli } from '../../../utils';

initBeforeTest();

describe('scss usage', () => {
  const appDirectory = __dirname;
  it('all', async () => {
    await runCli({
      argv: ['build'],
      appDirectory,
    });
    const distFilePath = path.join(appDirectory, './dist/index.css');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(content.includes(`rgba(198, 83, 140, 0.88)`)).toBeTruthy();
  });
});
