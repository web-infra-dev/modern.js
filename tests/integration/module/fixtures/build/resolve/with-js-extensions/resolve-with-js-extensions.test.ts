import { runCli, initBeforeTest } from '../../../utils';

initBeforeTest();

describe('resovle', () => {
  const fixtureDir = __dirname;
  it('with-condition-exports', async () => {
    const { success } = await runCli({
      argv: ['build'],
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();
  });
});
