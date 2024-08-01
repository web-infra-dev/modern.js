import path from 'path';
import { runCli, initBeforeTest } from '../../../utils';

initBeforeTest();

describe('duplicate alias', () => {
  const fixtureDir = __dirname;
  it('object usage', async () => {
    const bundleConfigFile = path.join(fixtureDir, './object.config.ts');
    const ret = await runCli({
      argv: ['build'],
      configFile: bundleConfigFile,
      appDirectory: fixtureDir,
    });

    expect(ret.success).toBeFalsy();
    expect(
      ret.error?.message.includes(
        'alias and resolve.alias are not allowed to be used together, alias will be deprecated in the future, please use resolve.alias instead',
      ),
    ).toBeTruthy();
  });
});
