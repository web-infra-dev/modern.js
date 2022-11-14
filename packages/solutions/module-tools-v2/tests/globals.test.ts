import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from './utils';

initBeforeTest();

beforeAll(() => {
  jest.mock('../src/utils/onExit.ts', () => {
    return {
      __esModule: true,
      addExitListener: jest.fn(() => 'mocked'),
    };
  });
});

describe('globals usage', () => {
  const fixtureDir = path.join(__dirname, './fixtures/globals');
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
      content.includes(`Function("return this")()["React"];`),
    ).toBeTruthy();
    expect(content).toMatchSnapshot();
  });

  it(`globals is { react: 'React' }, format is iife`, async () => {
    const distFilePath = path.join(fixtureDir, './dist/iife/index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(await fs.pathExists(distFilePath)).toBeTruthy();
    expect(
      content.includes(`module.exports = Function("return this")()["React"];`),
    ).toBeTruthy();
    expect(content).toMatchSnapshot();
  });
});
