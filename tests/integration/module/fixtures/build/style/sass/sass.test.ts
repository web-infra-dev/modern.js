import path from 'path';
import { fs } from '@modern-js/utils';
import { initBeforeTest, runCli } from '../../../utils';

initBeforeTest();

describe('sass usage', () => {
  const appDirectory = __dirname;
  it('all', async () => {
    await runCli({
      argv: ['build'],
      appDirectory,
    });
    const distFilePath = path.join(appDirectory, './dist/index.css');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(content.includes(`display: flex !important`)).toBeTruthy();
  });
});
