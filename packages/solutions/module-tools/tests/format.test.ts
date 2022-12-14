import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from './utils';
import {
  bundleDistPath,
  bundlelessDistPath,
  REQUIRE_REGEX,
  IMPORT_FROM_REGEX,
  IIFE_REGEX,
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

const configDir = path.join(__dirname, './fixtures/format');

describe('format is esm', () => {
  const fixtureDir = path.join(__dirname, './fixtures/format/esm');
  it('buildType is bundle', async () => {
    const configFile = path.join(configDir, './esm-bundle.config.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    const distFilePath = path.join(fixtureDir, bundleDistPath, './index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(content.includes('export default')).toBe(true);
    expect(REQUIRE_REGEX.test(content)).toBe(false);
    expect(content).toMatchSnapshot();
  });

  it('buildType is bundleless', async () => {
    const configFile = path.join(configDir, './esm-bundleless.config.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });

    const distIndexPath = path.join(
      fixtureDir,
      bundlelessDistPath,
      './index.js',
    );
    const content1 = await fs.readFile(distIndexPath, 'utf-8');
    expect(content1.includes('export default')).toBe(true);
    // expect(REQUIRE_REG.test(content1)).toBe(false);
    expect(content1).toMatchSnapshot();

    const distUtilsPath = path.join(
      fixtureDir,
      bundlelessDistPath,
      './utils.js',
    );
    const content2 = await fs.readFile(distUtilsPath, 'utf-8');
    expect(content2.includes('export default')).toBe(true);
    expect(REQUIRE_REGEX.test(content2)).toBe(false);
    expect(content2).toMatchSnapshot();
  });
});

describe('format is cjs', () => {
  const fixtureDir = path.join(__dirname, './fixtures/format/cjs');
  it('buildType is bundle', async () => {
    const configFile = path.join(configDir, './cjs-bundle.config.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    const distFilePath = path.join(fixtureDir, bundleDistPath, './index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(content.includes('module.exports')).toBe(true);
    expect(content).toMatchSnapshot();
  });

  it('buildType is bundleless', async () => {
    const configFile = path.join(configDir, './cjs-bundleless.config.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });

    const distIndexPath = path.join(
      fixtureDir,
      bundlelessDistPath,
      './index.js',
    );
    const content1 = await fs.readFile(distIndexPath, 'utf-8');
    expect(content1.includes('module.exports')).toBe(true);
    expect(IMPORT_FROM_REGEX.test(content1)).toBe(false);
    expect(content1).toMatchSnapshot();

    const distUtilsPath = path.join(
      fixtureDir,
      bundlelessDistPath,
      './utils.js',
    );
    const content2 = await fs.readFile(distUtilsPath, 'utf-8');
    expect(content2.includes('module.exports')).toBe(true);
    expect(IMPORT_FROM_REGEX.test(content2)).toBe(false);
    expect(content2).toMatchSnapshot();
  });
});

describe('format is umd', () => {
  const fixtureDir = path.join(__dirname, './fixtures/format/umd');
  it('buildType is bundle', async () => {
    const configFile = path.join(configDir, './umd-bundle.config.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    const distFilePath = path.join(fixtureDir, bundleDistPath, './index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(content.includes('(function(global, factory) {')).toBe(true);
    expect(content).toMatchSnapshot();
  });

  it('buildType is bundleless', async () => {
    const configFile = path.join(configDir, './umd-bundleless.config.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });

    expect(success).toBeFalsy();
  });
});

describe('format is iife', () => {
  const fixtureDir = path.join(__dirname, './fixtures/format/iife');
  it('buildType is bundle', async () => {
    const configFile = path.join(configDir, './iife-bundle.config.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    const distFilePath = path.join(fixtureDir, bundleDistPath, './index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(IIFE_REGEX.test(content)).toBe(true);
    expect(content).toMatchSnapshot();
  });

  it('buildType is bundleless', async () => {
    const configFile = path.join(configDir, './iife-bundleless.config.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });

    expect(success).toBeFalsy();
  });
});
