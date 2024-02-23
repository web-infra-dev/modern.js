import path from 'path';
import { fs, globby, slash } from '@modern-js/utils';
import { runCli, initBeforeTest } from '../../utils';
import { bundleDistPath, bundlelessDistPath } from '../../constants';

initBeforeTest();

describe('asset.path', () => {
  const fixtureDir = path.join(__dirname, 'path');
  it('buildType is bundleless', async () => {
    const configFile = 'path.bundleless.config.ts';
    const ret = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });

    expect(ret.success).toBeTruthy();

    const distDir = path.join(fixtureDir, bundlelessDistPath);
    const distFilePath = path.join(distDir, './index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(content.includes('./asset/')).toBeTruthy();
  });

  it('buildType is bundle', async () => {
    const configFile = 'path.bundle.config.ts';
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    const distDir = path.join(fixtureDir, bundleDistPath);
    const distFilePath = path.join(distDir, './index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(content.includes('data:image')).toBeTruthy();

    const pngFileDirName = path.join(distDir, './asset');
    const files = await globby(slash(`${pngFileDirName}/*.png`));
    expect(files.length).toBe(0);
  });
});

describe('asset.svgr', () => {
  const fixtureDir = path.join(__dirname, 'svgr');
  it('bundle', async () => {
    const configFile = 'bundle.config.ts';
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();
    const distFilePath = path.join(fixtureDir, './dist/bundle/index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(content.includes(`jsx("svg"`)).toBeTruthy();
    // should not remove SVG viewBox attribute
    expect(content.includes('viewBox: "0 0 841.9 595.3"')).toBeTruthy();
  });
  it('bundleless', async () => {
    const configFile = 'bundleless.config.ts';
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();
    const distFilePath = path.join(fixtureDir, './dist/bundleless/logo.js');
    expect(fs.existsSync(distFilePath)).toBeTruthy();
  });
  it('options with exclude', async () => {
    const configFile = 'exclude.config.ts';
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();
    const distFilePath = path.join(fixtureDir, './dist/exclude/index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(content.includes(`data:image`)).toBeTruthy();
  });
});

describe('asset.limit', () => {
  const fixtureDir = path.join(__dirname, 'limit');
  it('limit is 0', async () => {
    await runCli({
      argv: ['build'],
      appDirectory: fixtureDir,
    });
    const distFilePath = path.join(fixtureDir, './dist/index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(content.includes(`import`)).toBeTruthy();
  });
});

describe('asset.publicPath', () => {
  const fixtureDir = path.join(__dirname, 'publicPath');
  it('have publicPath', async () => {
    await runCli({
      argv: ['build'],
      appDirectory: fixtureDir,
    });
    const distFilePath = path.join(fixtureDir, './dist/index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(content.includes(`/public/`)).toBeTruthy();
  });
});
