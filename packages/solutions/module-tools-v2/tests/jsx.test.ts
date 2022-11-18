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

describe('jsx is automatic', () => {
  const fixtureDir = path.join(__dirname, './fixtures/jsx');
  it('buildType is bundle', async () => {
    const configFile = path.join(fixtureDir, './automatic-bundle.config.ts');
    const ret = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(ret.success).toBeTruthy();
    const distFilePath = path.join(
      fixtureDir,
      './dist/automatic/bundle/index.js',
    );
    const content = await fs.readFile(distFilePath, 'utf8');
    expect(content.includes('import_jsx_runtime')).toBeTruthy();
  });

  it('buildType is bundleless', async () => {
    const configFile = path.join(
      fixtureDir,
      './automatic-bundleless.config.ts',
    );
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    const distFilePath = path.join(
      fixtureDir,
      './dist/automatic/bundleless/index.js',
    );
    const content = await fs.readFile(distFilePath, 'utf8');
    expect(content.includes('import_jsx_runtime')).toBeTruthy();
  });
});

describe('jsx is transform', () => {
  const fixtureDir = path.join(__dirname, './fixtures/jsx');
  it('buildType is bundle', async () => {
    const configFile = path.join(fixtureDir, './transform-bundle.config.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    const distFilePath = path.join(
      fixtureDir,
      './dist/transform/bundle/index.js',
    );
    const content = await fs.readFile(distFilePath, 'utf8');
    expect(content.includes('React.createElement')).toBeTruthy();
  });

  // TODO: libuild fix
  // it('buildType is bundleless', async () => {
  //   const configFile = path.join(
  //     fixtureDir,
  //     './transform-bundleless.config.ts',
  //   );
  //   await runCli({
  //     argv: ['build'],
  //     configFile,
  //     appDirectory: fixtureDir,
  //   });
  //   const distFilePath = path.join(
  //     fixtureDir,
  //     './dist/transform/bundleless/index.js',
  //   );
  //   const content = await fs.readFile(distFilePath, 'utf8');
  //   expect(content.includes('React.createElement')).toBeTruthy();
  // });
});
