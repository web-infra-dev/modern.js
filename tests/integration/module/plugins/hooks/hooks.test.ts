import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from '../../fixtures/utils';

initBeforeTest();

describe('plugin-hooks', () => {
  const fixtureDir = __dirname;
  it('resolveModuleUserConfig', async () => {
    await runCli({
      argv: ['build'],
      appDirectory: fixtureDir,
    });

    expect(
      fs.pathExistsSync(path.resolve(__dirname, 'dist/index.js')),
    ).toBeTruthy();
  });
});
