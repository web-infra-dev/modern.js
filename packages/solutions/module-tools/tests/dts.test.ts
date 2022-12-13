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

describe('dts is false', () => {
  const fixtureDir = path.join(__dirname, './fixtures/dts');
  it('buildType is bundle', async () => {
    const configFile = path.join(fixtureDir, './false-bundle.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();
    const distDtsFilePath = path.join(
      fixtureDir,
      './dist/false-bundle/index.d.ts',
    );
    expect(await fs.pathExists(distDtsFilePath)).toBeFalsy();
  });

  it('buildType is bundleless', async () => {
    const configFile = path.join(fixtureDir, './false-bundleless.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();
    const distDtsFilePath = path.join(
      fixtureDir,
      './dist/false-bundleless/index.d.ts',
    );
    expect(await fs.pathExists(distDtsFilePath)).toBeFalsy();
  });
});

describe('dts.distPath', () => {
  const fixtureDir = path.join(__dirname, './fixtures/dts');
  it('buildType is bundle', async () => {
    const configFile = path.join(fixtureDir, './distPath-bundle.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();
    const distDtsFilePath = path.join(
      fixtureDir,
      './dist/bundle-dist-path/types/index.d.ts',
    );
    expect(await fs.pathExists(distDtsFilePath)).toBeTruthy();
  });

  it('buildType is bundleless', async () => {
    const configFile = path.join(fixtureDir, './distPath-bundleless.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();

    let distDtsFilePath = path.join(
      fixtureDir,
      './dist/bundleless-dist-path/types/index.d.ts',
    );
    expect(await fs.pathExists(distDtsFilePath)).toBeTruthy();
    distDtsFilePath = path.join(
      fixtureDir,
      './dist/bundleless-dist-path/types/b.d.ts',
    );
    expect(await fs.pathExists(distDtsFilePath)).toBeTruthy();
  });
});

describe('dts.tsconfigPath', () => {
  const fixtureDir = path.join(__dirname, './fixtures/dts');
  it('buildType is bundle', async () => {
    const configFile = path.join(fixtureDir, './tsconfigPath-bundle.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });

    expect(success).toBeTruthy();
    const distDtsFilePath = path.join(
      fixtureDir,
      './dist/tsconfig-path/bundle/index.d.ts',
    );
    expect(await fs.pathExists(distDtsFilePath)).toBeTruthy();
  });

  it('buildType is bundleless', async () => {
    const configFile = path.join(fixtureDir, './tsconfigPath-bundleless.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();
    let distDtsFilePath = path.join(
      fixtureDir,
      './dist/tsconfig-path/bundleless/index.d.ts',
    );
    expect(await fs.pathExists(distDtsFilePath)).toBeTruthy();

    distDtsFilePath = path.join(
      fixtureDir,
      './dist/tsconfig-path/bundleless/b.d.ts',
    );
    expect(await fs.pathExists(distDtsFilePath)).toBeTruthy();
  });
});

describe('dts.only is true', () => {
  const fixtureDir = path.join(__dirname, './fixtures/dts');
  it('buildType is bundle', async () => {
    const configFile = path.join(fixtureDir, './only-bundle.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();
    let distDtsFilePath = path.join(
      fixtureDir,
      './dist/only-bundle/index.d.ts',
    );
    expect(await fs.pathExists(distDtsFilePath)).toBeTruthy();
    distDtsFilePath = path.join(fixtureDir, './dist/only-bundle/index.js');
    expect(await fs.pathExists(distDtsFilePath)).toBeFalsy();
  });

  it('buildType is bundleless', async () => {
    const configFile = path.join(fixtureDir, './only-bundleless.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();
    let distDtsFilePath = path.join(
      fixtureDir,
      './dist/only-bundleless/index.d.ts',
    );
    expect(await fs.pathExists(distDtsFilePath)).toBeTruthy();

    distDtsFilePath = path.join(fixtureDir, './dist/only-bundleless/index.js');
    expect(await fs.pathExists(distDtsFilePath)).toBeFalsy();
  });
});
