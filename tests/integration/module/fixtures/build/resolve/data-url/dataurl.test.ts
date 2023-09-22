import { runCli, initBeforeTest } from '../../../utils';

initBeforeTest();

describe('resolve', () => {
  const fixtureDir = __dirname;
  it('data-url', async () => {
    const { success } = await runCli({
      argv: ['build'],
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();
  });
});
