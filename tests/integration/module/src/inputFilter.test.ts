import path from 'path';
import { globby, slash } from '@modern-js/utils';
import { runCli, initBeforeTest } from './utils';

initBeforeTest();

describe('input filter', () => {
  const fixtureDir = path.join(__dirname, './fixtures/inputFilter');

  it('build success', async () => {
    const configFile = path.join(fixtureDir, './modern.config.ts');
    const ret = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(ret.success).toBeTruthy();
  });

  it('filter *.a.ts:pattern 1', async () => {
    const distPath = path.join(fixtureDir, './dist/pattern-1');
    const distPattern = path.join(distPath, '*');
    const files = await globby(slash(distPattern));

    expect(files.length).toBe(1);
    expect(files[0]).toMatch(/index.js/);
  });

  it('filter *.a.ts:pattern 2', async () => {
    const distPath = path.posix.join(fixtureDir, './dist/pattern-2');
    const distPattern = path.posix.join(distPath, '*');
    const files = await globby(slash(distPattern));

    expect(files.length).toBe(1);
    expect(files[0]).toMatch(/index.js/);
  });
});
