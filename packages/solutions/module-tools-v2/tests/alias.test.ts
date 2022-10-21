import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from './utils';
import {
  aliasBundleObjectDistPath,
  aliasBundlelessFunctionDistPath,
  aliasBundleFunctionDistPath,
  aliasBundlelessObjectDistPath,
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

describe('alias in js project', () => {
  const fixtureDir = path.join(__dirname, './fixtures/alias/js');
  it('object usage', async () => {
    const bundleConfigFile = path.join(fixtureDir, './bundle-object.config.ts');
    await runCli({
      argv: ['build'],
      configFile: bundleConfigFile,
      appDirectory: fixtureDir,
    });
    let distFilePath = path.join(
      fixtureDir,
      aliasBundleObjectDistPath,
      './index.js',
    );
    expect(fs.existsSync(distFilePath)).toBe(true);
    let content = fs.readFileSync(distFilePath, 'utf-8');
    expect(content.includes('hello world')).toBe(true);
    expect(content).toMatchSnapshot();

    const bundlelessConfigFile = path.join(
      fixtureDir,
      './bundleless-object.config.ts',
    );
    await runCli({
      argv: ['build'],
      configFile: bundlelessConfigFile,
      appDirectory: fixtureDir,
    });
    distFilePath = path.join(
      fixtureDir,
      aliasBundlelessObjectDistPath,
      './index.js',
    );
    expect(fs.existsSync(distFilePath)).toBe(true);

    content = fs.readFileSync(distFilePath, 'utf-8');
    expect(content.includes(`"./b"`)).toBe(true);
    expect(content).toMatchSnapshot();
  });

  it('function usage', async () => {
    let configFile = path.join(fixtureDir, './bundle-function.config.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    let distFilePath = path.join(
      fixtureDir,
      aliasBundleFunctionDistPath,
      './index.js',
    );
    expect(fs.existsSync(distFilePath)).toBe(true);

    let content = fs.readFileSync(distFilePath, 'utf-8');
    expect(content.includes('hello world')).toBe(true);
    expect(content).toMatchSnapshot();

    configFile = path.join(fixtureDir, './bundleless-function.config.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    distFilePath = path.join(
      fixtureDir,
      aliasBundlelessFunctionDistPath,
      './index.js',
    );
    expect(fs.existsSync(distFilePath)).toBe(true);

    content = fs.readFileSync(distFilePath, 'utf-8');
    expect(content.includes(`"./b"`)).toBe(true);
    expect(content).toMatchSnapshot();
  });
});

describe('alias in ts project', () => {
  const fixtureDir = path.join(__dirname, './fixtures/alias/ts');
  it('object usage', async () => {
    const bundleConfigFile = path.join(fixtureDir, './bundle-object.config.ts');
    await runCli({
      argv: ['build'],
      configFile: bundleConfigFile,
      appDirectory: fixtureDir,
    });
    let distFilePath = path.join(
      fixtureDir,
      aliasBundleObjectDistPath,
      './index.js',
    );
    expect(fs.existsSync(distFilePath)).toBe(true);

    let content = fs.readFileSync(distFilePath, 'utf-8');
    expect(content.includes('hello world')).toBe(true);
    expect(content).toMatchSnapshot();

    const bundlelessConfigFile = path.join(
      fixtureDir,
      './bundleless-object.config.ts',
    );
    await runCli({
      argv: ['build'],
      configFile: bundlelessConfigFile,
      appDirectory: fixtureDir,
    });
    distFilePath = path.join(
      fixtureDir,
      aliasBundlelessObjectDistPath,
      './index.js',
    );
    expect(fs.existsSync(distFilePath)).toBe(true);

    content = fs.readFileSync(distFilePath, 'utf-8');
    expect(content.includes(`"./b"`)).toBe(true);
    expect(content).toMatchSnapshot();
  });

  it('function usage', async () => {
    let configFile = path.join(fixtureDir, './bundle-function.config.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    let distFilePath = path.join(
      fixtureDir,
      aliasBundleFunctionDistPath,
      './index.js',
    );
    expect(fs.existsSync(distFilePath)).toBe(true);

    let content = fs.readFileSync(distFilePath, 'utf-8');
    expect(content.includes('hello world')).toBe(true);
    expect(content).toMatchSnapshot();

    configFile = path.join(fixtureDir, './bundleless-function.config.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    distFilePath = path.join(
      fixtureDir,
      aliasBundlelessFunctionDistPath,
      './index.js',
    );
    expect(fs.existsSync(distFilePath)).toBe(true);

    content = fs.readFileSync(distFilePath, 'utf-8');
    expect(content.includes(`"./b"`)).toBe(true);
    expect(content).toMatchSnapshot();
  });
});
