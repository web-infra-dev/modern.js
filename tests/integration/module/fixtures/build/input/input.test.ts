import path from 'path';
import { fs, globby, slash } from '@modern-js/utils';
import { runCli, initBeforeTest } from '../../utils';

initBeforeTest();

const fixtureDir = __dirname;
describe('input usage', () => {
  it('entry is object', async () => {
    const configFile = path.join(fixtureDir, './object.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();

    const distFilePath = path.join(fixtureDir, './dist/object/main.js');
    expect(await fs.pathExists(distFilePath)).toBeTruthy();
  });

  it('entry is array', async () => {
    const configFile = path.join(fixtureDir, './array.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();

    const distFilePath = path.join(fixtureDir, './dist/array/index.js');
    expect(await fs.pathExists(distFilePath)).toBeTruthy();

    const distBrowserFilePath = path.join(
      fixtureDir,
      './dist/array/browser.js',
    );
    expect(await fs.pathExists(distBrowserFilePath)).toBeTruthy();
  });
});

describe('input filter', () => {
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

    expect(files.length).toBe(3);
  });

  it('filter *.a.ts:pattern 2', async () => {
    const distPath = path.posix.join(fixtureDir, './dist/pattern-2');
    const distPattern = path.posix.join(distPath, '*');
    const files = await globby(slash(distPattern));

    expect(files.length).toBe(3);
  });
});
