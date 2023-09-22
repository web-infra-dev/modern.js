import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from '../../../utils';

initBeforeTest();

describe('less', () => {
  const appDirectory = __dirname;
  it('options usage', async () => {
    await runCli({
      argv: ['build'],
      appDirectory,
    });
    const distFilePath = path.join(appDirectory, './dist/options/index.css');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(
      content.includes(`5px`) && content.includes(`rgba(198, 83, 140, 0.88)`),
    ).toBeTruthy();
  });

  it('import', async () => {
    const { success, error } = await runCli({
      argv: ['build'],
      appDirectory,
      configFile: 'import.config.ts',
    });
    console.log(error);
    expect(success).toBeTruthy();
  });
});
