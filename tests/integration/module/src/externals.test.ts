import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from './utils';

initBeforeTest();

describe('externals usage', () => {
  const fixtureDir = path.join(__dirname, './fixtures/externals');
  it('externals is string[] or RegExp[]', async () => {
    const configFile = path.join(fixtureDir, './config.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();

    let distFilePath = path.join(fixtureDir, './dist/string/index.js');
    let content = await fs.readFile(distFilePath, 'utf-8');
    expect(await fs.pathExists(distFilePath)).toBeTruthy();
    expect(content.includes(`require("react")`)).toBeTruthy();

    distFilePath = path.join(fixtureDir, './dist/regexp/index.js');
    content = await fs.readFile(distFilePath, 'utf-8');
    expect(await fs.pathExists(distFilePath)).toBeTruthy();
    expect(content.includes(`require("react")`)).toBeTruthy();
  });
});
