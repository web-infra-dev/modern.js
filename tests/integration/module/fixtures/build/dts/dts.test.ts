import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from '../../utils';

initBeforeTest();

beforeAll(() => {
  // MaxListenersExceededWarning, becasue of `createCli->init` in @modern-js/core
  require('events').EventEmitter.defaultMaxListeners = 15;
});

afterAll(() => {
  require('events').EventEmitter.defaultMaxListeners = 10;
});

const fixtureDir = __dirname;
const enableDts = true;

describe('dts build', () => {
  it('buildType is bundle', async () => {
    const configFile = path.join(fixtureDir, './dts-bundle.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
      enableDts,
    });
    // dts.distPath
    const distDtsFilePath = path.join(
      fixtureDir,
      './dist/bundle/types/index.d.ts',
    );
    const distJsFilePath = path.join(fixtureDir, './dist/bundle/index.js');
    // dts.only
    expect(fs.existsSync(distJsFilePath)).toBeFalsy();
    const content = await fs.readFile(distDtsFilePath, 'utf8');
    // dts.respectExternal
    expect(content.includes('export { Ref } from')).toBeTruthy();
  });

  it('buildType is bundleless', async () => {
    const configFile = path.join(fixtureDir, './dts-bundleless.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
      enableDts,
    });

    const compositeDistPath = path.join(
      fixtureDir,
      '../dts-composite/dist/index.d.ts',
    );
    expect(fs.existsSync(compositeDistPath)).toBeTruthy();

    const distMapPath = path.join(
      fixtureDir,
      './dist/bundleless/types/index.d.ts.map',
    );
    const mapContent = JSON.parse(await fs.readFile(distMapPath, 'utf8'));

    // source map
    expect(
      path.resolve(path.dirname(distMapPath), mapContent.sources[0]) ===
        path.resolve(fixtureDir, 'src/index.ts'),
    ).toBeTruthy();

    const distPath = path.join(
      fixtureDir,
      './dist/bundleless/types/index.d.ts',
    );
    const content = await fs.readFile(distPath, 'utf8');
    expect(content.includes('./b')).toBeTruthy();
  });
});

describe('dts is false', () => {
  it('buildType is bundle', async () => {
    const configFile = path.join(fixtureDir, './false-bundle.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
      enableDts,
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
      enableDts,
    });
    expect(success).toBeTruthy();
    const distDtsFilePath = path.join(
      fixtureDir,
      './dist/false-bundleless/index.d.ts',
    );
    expect(await fs.pathExists(distDtsFilePath)).toBeFalsy();
  });
});

describe('dts.abortOnError is false', () => {
  it('buildType is bundle', async () => {
    const configFile = path.join(fixtureDir, './abortOnError-bundle.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
      enableDts,
    });
    expect(success).toBeTruthy();
  });

  it('buildType is bundleless', async () => {
    const configFile = path.join(fixtureDir, './abortOnError-bundleless.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
      enableDts,
    });
    expect(success).toBeTruthy();
  });
});
