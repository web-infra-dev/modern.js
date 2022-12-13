import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from './utils';

initBeforeTest();

jest.setTimeout(50000);

beforeAll(() => {
  jest.mock('../src/utils/onExit.ts', () => {
    return {
      __esModule: true,
      addExitListener: jest.fn(() => 'mocked'),
    };
  });
  jest.setTimeout(30000);
});

describe('autoExternal usage', () => {
  const fixtureDir = path.join(__dirname, './fixtures/autoExternal');
  it('build success', async () => {
    const configFile = path.join(fixtureDir, './config.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();
  });

  it('autoExternal is false', async () => {
    const distFilePath = path.join(fixtureDir, './dist/1/index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(await fs.pathExists(distFilePath)).toBeTruthy();
    expect(content.includes(`require("react")`)).toBeFalsy();
    expect(content.includes(`require("postcss")`)).toBeFalsy();
    expect(content.includes(`require("path-browserify")`)).toBeFalsy();
  });

  it('autoExternal is false with externals', async () => {
    const distFilePath = path.join(fixtureDir, './dist/2/index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(await fs.pathExists(distFilePath)).toBeTruthy();
    expect(content.includes(`require("postcss")`)).toBeFalsy();
    expect(content.includes(`require("path-browserify")`)).toBeFalsy();
  });

  it('autoExternal: { dependencies: true }', async () => {
    const distFilePath = path.join(fixtureDir, './dist/3/index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(await fs.pathExists(distFilePath)).toBeTruthy();
    expect(content.includes(`require("react")`)).toBeFalsy();
    expect(content.includes(`require("postcss")`)).toBeFalsy();
    expect(content.includes(`require("path-browserify")`)).toBeTruthy();
  });

  it('autoExternal: { peerDependencies: true }', async () => {
    const distFilePath = path.join(fixtureDir, './dist/5/index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(await fs.pathExists(distFilePath)).toBeTruthy();
    expect(content.includes(`require("react")`)).toBeFalsy();
    expect(content.includes(`require("postcss")`)).toBeTruthy();
    expect(content.includes(`require("path-browserify")`)).toBeFalsy();
  });
});
