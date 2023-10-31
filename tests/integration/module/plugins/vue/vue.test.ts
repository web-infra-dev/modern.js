import { runCli, initBeforeTest } from '../../fixtures/utils';

initBeforeTest();

describe('plugin-babel', () => {
  const fixtureDir = __dirname;
  it('preset-env', async () => {
    const { success } = await runCli({
      argv: ['build'],
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();
  });
});
