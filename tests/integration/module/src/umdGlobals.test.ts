import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from './utils';

initBeforeTest();

describe('globals usage', () => {
  const fixtureDir = path.join(__dirname, './fixtures/umdGlobals');
  it(`build success`, async () => {
    const configFile = path.join(fixtureDir, './config.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();
  });

  it(`globals is { react: 'React' }, format is umd`, async () => {
    const distFilePath = path.join(fixtureDir, './dist/umd/index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(await fs.pathExists(distFilePath)).toBeTruthy();
    expect(
      content.includes(
        `(typeof globalThis !== "undefined" ? globalThis : Function("return this")() || global || self)["React"]`,
      ),
    ).toBeTruthy();
    expect(content).toMatchSnapshot();
  });

  it(`globals is { react: 'React' }, format is iife`, async () => {
    const distFilePath = path.join(fixtureDir, './dist/iife/index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(await fs.pathExists(distFilePath)).toBeTruthy();
    expect(
      content.includes(
        `module.exports = (typeof globalThis !== "undefined" ? globalThis : Function("return this")() || global || self)["React"];`,
      ),
    ).toBeTruthy();
    expect(content).toMatchSnapshot();
  });
});
