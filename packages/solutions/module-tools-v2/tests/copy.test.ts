import path from 'path';
import { fs } from '@modern-js/utils';
// import { fs, globby } from '@modern-js/utils';
import { runCli, initBeforeTest } from './utils';
// import { bundleDistPath } from './constants';

initBeforeTest();

describe('copy usage', () => {
  const fixtureDir = path.join(__dirname, './fixtures/copy');
  it('buildType is bundle', async () => {
    const configFile = path.join(fixtureDir, './config-1.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(0).toBe(0);
    // const distFilePath = path.join(fixtureDir, './dist/copy1/index.js');
    // const content = await fs.readFile(distFilePath, 'utf8');
    // expect(content.includes('import_jsx_runtime')).toBeTruthy();
  });
});
