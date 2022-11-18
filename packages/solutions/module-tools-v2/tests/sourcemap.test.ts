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

describe('sourcemap usage', () => {
  const fixtureDir = path.join(__dirname, './fixtures/sourcemap');
  it('sourcemap is true', async () => {
    const configFile = path.join(fixtureDir, './true.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    const distSourceMapFilePath = path.join(
      fixtureDir,
      './dist/true/index.js.map',
    );
    expect(await fs.pathExists(distSourceMapFilePath)).toBe(true);
    const content = fs.readFileSync(distSourceMapFilePath, 'utf-8');
    expect(content).toMatchSnapshot();
  });

  it('sourcemap is false', async () => {
    const configFile = path.join(fixtureDir, './false.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    const distSourceMapFilePath = path.join(
      fixtureDir,
      './dist/false/index.js.map',
    );
    expect(await fs.pathExists(distSourceMapFilePath)).toBe(false);
  });

  it('sourcemap is inline', async () => {
    const configFile = path.join(fixtureDir, './inline.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    const distFilePath = path.join(fixtureDir, './dist/inline/index.js');
    const distSourceMapFilePath = path.join(
      fixtureDir,
      './dist/inline/index.js.map',
    );
    expect(await fs.pathExists(distSourceMapFilePath)).toBe(false);
    const content = fs.readFileSync(distFilePath, 'utf-8');
    expect(
      content.includes('sourceMappingURL=data:application/json;'),
    ).toBeTruthy();
  });

  it('sourcemap is external', async () => {
    const configFile = path.join(fixtureDir, './external.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    const distFilePath = path.join(fixtureDir, './dist/external/index.js');
    const distSourceMapFilePath = path.join(
      fixtureDir,
      './dist/external/index.js.map',
    );
    expect(await fs.pathExists(distSourceMapFilePath)).toBe(true);
    const content = fs.readFileSync(distFilePath, 'utf-8');
    expect(content).toMatchSnapshot();
  });
});
