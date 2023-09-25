import { runCli, initBeforeTest } from '../../utils';

initBeforeTest();

describe('dts.tsconfigPath', () => {
  it('buildType is bundle', async () => {
    const fixtureDir = __dirname;
    const { success } = await runCli({
      argv: ['build'],
      appDirectory: fixtureDir,
    });

    expect(success).toBeTruthy();
  });
});
