import path from 'path';
import { fs } from '@modern-js/utils';
import { initBeforeTest, runCli } from '../../utils';

initBeforeTest();

describe('platform usage', () => {
  const fixtureDir = __dirname;
  // https://esbuild.github.io/api/#platform
  it('platform is node', async () => {
    const configFile = path.join(fixtureDir, './node.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();

    const distFilePath = path.join(fixtureDir, './dist/node/index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(content.includes(`require("path")`)).toBeTruthy();
  });

  it('platform is browser', async () => {
    const configFile = path.join(fixtureDir, './browser.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();

    const distFilePath = path.join(fixtureDir, './dist/browser/index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(content.includes(`path-browserify`)).toBeTruthy();
  });
});
