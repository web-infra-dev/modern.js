import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from '../../utils';

initBeforeTest();

describe('tsconfig extends', () => {
  const fixtureDir = __dirname;
  it('should emit decorator metadata when extends from root tsconfig', async () => {
    const configFile = path.join(fixtureDir, './modern.config.ts');
    const { success, error } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    console.log(error);
    expect(success).toBeTruthy();
    const distFilePath = path.join(fixtureDir, 'dist/main.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(content).toMatchSnapshot();
  });
});
