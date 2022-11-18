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

describe('minify usage', () => {
  const fixtureDir = path.join(__dirname, './fixtures/minify');
  it('false, esbuild, terser', async () => {
    const configFile = path.join(fixtureDir, './config.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();

    const distEsbuildFilePath = path.join(
      fixtureDir,
      './dist/esbuild/index.js',
    );
    expect(await fs.pathExists(distEsbuildFilePath)).toBeTruthy();
    const distTerserFilePath = path.join(fixtureDir, './dist/terser/index.js');
    expect(await fs.pathExists(distTerserFilePath)).toBeTruthy();
    const distFilePath = path.join(fixtureDir, './dist/false/index.js');
    expect(await fs.pathExists(distFilePath)).toBeTruthy();

    const contentByEsbuildMinify = await fs.readFile(
      distEsbuildFilePath,
      'utf-8',
    );
    const esbuildMinifyStat = fs.stat(distEsbuildFilePath);

    const contentByTerserMinify = await fs.readFile(
      distTerserFilePath,
      'utf-8',
    );
    const terserMinifyStat = fs.stat(distTerserFilePath);
    const stat = fs.stat(distFilePath);

    expect(contentByEsbuildMinify === contentByTerserMinify).not.toBeTruthy();
    expect((await esbuildMinifyStat).size).toBeLessThan((await stat).size);
    expect((await terserMinifyStat).size).toBeLessThan((await stat).size);
  });
});
