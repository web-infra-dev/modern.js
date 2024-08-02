import path from 'path';
import { runCli, initBeforeTest } from '../../utils';

initBeforeTest();

describe('loader', () => {
  it('esbuild usage', async () => {
    const ret = await runCli({
      argv: ['build'],
      appDirectory: path.join(__dirname, 'esbuild'),
    });
    console.log(ret);
    expect(ret.success).toBe(true);
  });
  it('swc usage', async () => {
    const ret = await runCli({
      argv: ['build'],
      appDirectory: path.join(__dirname, 'swc'),
    });

    expect(ret.success).toBe(true);
  });
});
