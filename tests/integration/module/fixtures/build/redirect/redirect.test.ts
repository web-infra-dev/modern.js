import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from '../../utils';

initBeforeTest();

describe('redirect', () => {
  const fixtureDir = __dirname;
  it('no-redirect', async () => {
    const configFile = path.join(fixtureDir, './no-redirect.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    const distFilePath = path.join(fixtureDir, './dist/no-redirect/index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(
      content.includes(`import css from "./index.module.css"`),
    ).toBeTruthy();
  });
  it('redirect alias and style and asset', async () => {
    const configFile = path.join(fixtureDir, './redirect.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });

    const distJsFilePath = path.join(fixtureDir, './dist/redirect/index.js');
    const jsContent = await fs.readFile(distJsFilePath, 'utf-8');
    // redirect alias
    expect(jsContent.includes(`import alias from "./alias"`)).toBeTruthy();
    // redirect style
    expect(
      jsContent.includes(`import css from "./index_module_css";`),
    ).toBeTruthy();
    // redirect asset
    expect(jsContent.includes(`import svg from "./assets/logo`)).toBeTruthy();

    const distJsonFilePath = path.join(
      fixtureDir,
      './dist/redirect/index_module_css.js',
    );
    const distCssFilePath = path.join(
      fixtureDir,
      './dist/redirect/index_module.css',
    );
    expect(fs.existsSync(distJsonFilePath)).toBeTruthy();
    expect(fs.existsSync(distCssFilePath)).toBeTruthy();
  });
});
