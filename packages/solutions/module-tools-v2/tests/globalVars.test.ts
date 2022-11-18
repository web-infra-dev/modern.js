import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from './utils';
import {
  globalVarsBundleDistPath,
  globalVarsBundlelessDistPath,
} from './constants';

initBeforeTest();

beforeAll(() => {
  jest.mock('../src/utils/onExit.ts', () => {
    return {
      __esModule: true,
      addExitListener: jest.fn(() => 'mocked'),
    };
  });
});

describe('envVars in js project', () => {
  const fixtureDir = path.join(__dirname, './fixtures/globalVars/js');
  it('buildType is bundle', async () => {
    const configFile = path.join(fixtureDir, './bundle.config.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    const distFilePath = path.join(
      fixtureDir,
      globalVarsBundleDistPath,
      './index.js',
    );
    expect(fs.existsSync(distFilePath)).toBe(true);
    const content = fs.readFileSync(distFilePath, 'utf-8');
    expect(content.includes('1.0.1')).toBe(true);
  });

  it('buildType is bundleless', async () => {
    const bundleConfigFile = path.join(fixtureDir, './bundleless.config.ts');
    await runCli({
      argv: ['build'],
      configFile: bundleConfigFile,
      appDirectory: fixtureDir,
    });
    const distFilePath = path.join(
      fixtureDir,
      globalVarsBundlelessDistPath,
      './index.js',
    );
    expect(fs.existsSync(distFilePath)).toBe(true);
    const content = fs.readFileSync(distFilePath, 'utf-8');
    expect(content.includes('1.0.1')).toBe(true);
  });
});

describe('envVars in ts project', () => {
  const fixtureDir = path.join(__dirname, './fixtures/globalVars/ts');
  it('buildType is bundle', async () => {
    const configFile = path.join(fixtureDir, './bundle.config.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    const distFilePath = path.join(
      fixtureDir,
      globalVarsBundleDistPath,
      './index.js',
    );
    expect(fs.existsSync(distFilePath)).toBe(true);

    const content = fs.readFileSync(distFilePath, 'utf-8');
    expect(content.includes('1.0.1')).toBe(true);
  });

  it('buildType is bundleless', async () => {
    const configFile = path.join(fixtureDir, './bundleless.config.ts');
    const ret = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    console.info(ret.error);
    expect(ret.success).toBe(true);

    const distFilePath = path.join(
      fixtureDir,
      globalVarsBundlelessDistPath,
      './index.js',
    );
    expect(fs.existsSync(distFilePath)).toBe(true);

    const content = fs.readFileSync(distFilePath, 'utf-8');
    expect(content.includes('1.0.1')).toBe(true);
  });
});
