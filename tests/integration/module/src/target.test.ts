import path from 'path';
import { runCli, initBeforeTest } from './utils';

initBeforeTest();

const configDir = path.join(__dirname, './fixtures/target');

describe('target usage', () => {
  const fixtureDir = configDir;
  it('target is es2021', async () => {
    const configFile = path.join(configDir, './config.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });

    expect(success).toBeTruthy();
  });
});
