import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from '../../../utils';

initBeforeTest();

describe('css', () => {
  const appDirectory = __dirname;
  it('all', async () => {
    const { success } = await runCli({
      argv: ['build'],
      appDirectory,
    });
    expect(success).toBeTruthy();
  });
});
