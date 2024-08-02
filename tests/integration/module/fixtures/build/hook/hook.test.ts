import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from '../../utils';

initBeforeTest();

describe('hook.applyAfterBuiltIn', () => {
  const fixtureDir = __dirname;
  it('after', async () => {
    const ret = await runCli({
      argv: ['build'],
      appDirectory: fixtureDir,
    });
    console.log(ret);

    expect(ret.success).toBe(true);

    const distFilePath = path.join(fixtureDir, './dist/index.js');
    expect(fs.existsSync(distFilePath)).toBe(true);
    const content = fs.readFileSync(distFilePath, 'utf-8');
    expect(content.includes('after')).toBe(true);
  });
});
