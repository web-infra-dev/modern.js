import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from './utils';

initBeforeTest();

jest.setTimeout(100000);

beforeAll(() => {
  jest.mock('../src/utils/onExit.ts', () => {
    return {
      __esModule: true,
      addExitListener: jest.fn(() => 'mocked'),
    };
  });
});

describe('styleCompileMode', () => {
  const fixtureDir = path.join(__dirname, './fixtures/styleCompileMode');
  it('build success', async () => {
    const configFile = path.join(fixtureDir, './config.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();
  });

  it('with-source-code', async () => {
    const distPath = path.join(fixtureDir, 'dist/with-source-code');

    const styleSassPath = path.join(distPath, 'style.scss');
    console.info(styleSassPath);
    expect(await fs.pathExists(styleSassPath)).toBeTruthy();

    const styleCssPath = path.join(distPath, 'style.css');
    expect(await fs.pathExists(styleCssPath)).toBeTruthy();

    const buttonStyleLessPath = path.join(distPath, './button/style.less');
    expect(await fs.pathExists(buttonStyleLessPath)).toBeTruthy();

    const buttonStyleCssPath = path.join(distPath, './button/style.css');
    expect(await fs.pathExists(buttonStyleCssPath)).toBeTruthy();
  });

  it('only-compiled-code', async () => {
    const distPath = path.join(fixtureDir, 'dist/compiled-code');

    const styleSassPath = path.join(distPath, 'style.scss');
    expect(await fs.pathExists(styleSassPath)).toBeFalsy();

    const styleCssPath = path.join(distPath, 'style.css');
    expect(await fs.pathExists(styleCssPath)).toBeTruthy();

    const buttonStyleLessPath = path.join(distPath, './button/style.less');
    expect(await fs.pathExists(buttonStyleLessPath)).toBeFalsy();

    const buttonStyleCssPath = path.join(distPath, './button/style.css');
    expect(await fs.pathExists(buttonStyleCssPath)).toBeTruthy();
  });
});
