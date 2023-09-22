import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from '../../utils';

initBeforeTest();

describe('banner and footer', () => {
  const fixtureDir = __dirname;
  it('buildType is bundle', async () => {
    const configFile = path.join(fixtureDir, './bundle.config.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
      enableDts: true,
    });
    const [js, css, dts] = await Promise.all([
      fs.readFile(path.join(fixtureDir, 'dist/bundle/index.js'), 'utf8'),
      fs.readFile(path.join(fixtureDir, 'dist/bundle/index.css'), 'utf8'),
      fs.readFile(path.join(fixtureDir, 'dist/bundle/index.d.ts'), 'utf8'),
    ]);

    expect(js).toContain('js banner');
    expect(js).toContain('js banner');
    expect(css).toContain('css banner');
    expect(css).toContain('css banner');
    expect(dts).toContain('dts banner');
    expect(dts).toContain('dts banner');
  });

  it('buildType is bundleless', async () => {
    const configFile = path.join(fixtureDir, './bundleless.config.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
      enableDts: true,
    });
    const [js, css, dts] = await Promise.all([
      fs.readFile(path.join(fixtureDir, 'dist/bundleless/index.js'), 'utf8'),
      fs.readFile(path.join(fixtureDir, 'dist/bundleless/index.css'), 'utf8'),
      fs.readFile(path.join(fixtureDir, 'dist/bundleless/index.d.ts'), 'utf8'),
    ]);

    expect(js).toContain('js footer');
    expect(js).toContain('js footer');
    expect(css).toContain('css footer');
    expect(css).toContain('css footer');
    expect(dts).toContain('dts footer');
    expect(dts).toContain('dts footer');
  });
});
