import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from './utils';
import { bundleDistPath, bundlelessDistPath } from './constants';

initBeforeTest();

beforeAll(() => {
  jest.mock('../src/utils/onExit.ts', () => {
    return {
      __esModule: true,
      addExitListener: jest.fn(() => 'mocked'),
    };
  });
});

// afterAll(() => {
//   jest.clearAllTimers();
// });

describe('`designSystem` case', () => {
  const fixtureDir = path.join(__dirname, './fixtures/designSystem');
  it('buildType is bundle', async () => {
    const configFile = path.join(fixtureDir, './bundle.config.ts');

    const ret = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
      enableTailwindCss: true,
    });
    console.info(ret);
    expect(ret.success).toBeTruthy();

    const distFilePath = path.join(fixtureDir, bundleDistPath, './index.css');
    console.info(distFilePath);
    expect(fs.existsSync(distFilePath)).toBe(true);
    const content = fs.readFileSync(distFilePath, 'utf-8');
    expect(content.includes('0, 0, 0')).toBe(true);
    expect(content).toMatchSnapshot();
  });

  it('buildType is bundleless', async () => {
    const configFile = path.join(fixtureDir, './bundleless.config.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
      enableTailwindCss: true,
    });
    const distFilePath = path.join(
      fixtureDir,
      bundlelessDistPath,
      './index.css',
    );
    expect(fs.existsSync(distFilePath)).toBe(true);
    const content = fs.readFileSync(distFilePath, 'utf-8');
    expect(content.includes('0, 0, 0')).toBe(true);
    expect(content).toMatchSnapshot();
  });
});
