import { runCli, initBeforeTest } from '../../utils';

initBeforeTest();

describe('shims', () => {
  const fixtureDir = __dirname;
  it('shims', async () => {
    const { success } = await runCli({
      argv: ['build'],
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();
  });
});
