import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from '../../utils';

initBeforeTest();

describe('alias in js project', () => {
  const fixtureDir = path.join(__dirname, 'js');
  it('object usage', async () => {
    const bundleConfigFile = path.join(fixtureDir, './object.config.ts');
    const ret = await runCli({
      argv: ['build'],
      configFile: bundleConfigFile,
      appDirectory: fixtureDir,
    });

    expect(ret.success).toBe(true);

    const distFilePath = path.join(fixtureDir, './dist/object/index.js');
    expect(fs.existsSync(distFilePath)).toBe(true);
    const content = fs.readFileSync(distFilePath, 'utf-8');
    expect(content.includes('hello world')).toBe(true);
  });

  it('function usage', async () => {
    const configFile = path.join(fixtureDir, './function.config.ts');
    const ret = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(ret.success).toBeTruthy();
    const distFilePath = path.join(fixtureDir, './dist/function/index.js');
    expect(fs.existsSync(distFilePath)).toBe(true);

    const content = fs.readFileSync(distFilePath, 'utf-8');
    expect(content.includes('hello world')).toBe(true);
  });
});

describe('alias in ts project', () => {
  const fixtureDir = path.join(__dirname, 'ts');
  it('object usage, buildType is bundle', async () => {
    const bundleConfigFile = path.join(fixtureDir, './object.config.ts');

    const ret = await runCli({
      argv: ['build'],
      configFile: bundleConfigFile,
      appDirectory: fixtureDir,
    });
    expect(ret.success).toBeTruthy();

    const distFilePath = path.join(fixtureDir, './dist/object/index.js');
    expect(fs.existsSync(distFilePath)).toBe(true);

    const content = fs.readFileSync(distFilePath, 'utf-8');
    expect(content.includes('hello world')).toBe(true);
  });

  it('function usage', async () => {
    const configFile = path.join(fixtureDir, './function.config.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    const distFilePath = path.join(fixtureDir, './dist/function/index.js');
    expect(fs.existsSync(distFilePath)).toBe(true);

    const content = fs.readFileSync(distFilePath, 'utf-8');
    expect(content.includes('hello world')).toBe(true);
  });
  it('tsconfig path', async () => {
    await runCli({
      argv: ['build'],
      appDirectory: fixtureDir,
    });
    const distFilePath = path.join(fixtureDir, './dist/tsconfig/index.js');
    expect(fs.existsSync(distFilePath)).toBe(true);

    const content = fs.readFileSync(distFilePath, 'utf-8');
    expect(content.includes('hello world')).toBe(true);
  });
});

describe('resolve alias for module id', () => {
  const fixtureDir = path.join(__dirname, 'module-id');
  it('uncorrect module id', async () => {
    const ret = await runCli({
      argv: ['build'],
      appDirectory: fixtureDir,
    });

    expect(ret.success).toBe(true);

    const distFilePath = path.join(fixtureDir, './dist/index.js');
    expect(fs.existsSync(distFilePath)).toBe(true);
    const content = fs.readFileSync(distFilePath, 'utf-8');
    expect(content.includes('./react-native')).toBe(true);
  });
});
