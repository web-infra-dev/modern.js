import path from 'path';
import { globby, fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from '../../../utils';

initBeforeTest();

describe('autoExtension', () => {
  const fixtureDir = __dirname;
  it('type:module', async () => {
    await runCli({
      argv: ['build'],
      appDirectory: fixtureDir,
      enableDts: true,
    });
    const cwd = path.join(fixtureDir, 'dist/cjs');
    const outputDeclarationFile = await globby('*.d.cts', {
      cwd,
    });
    const outputCjsFile = await globby('*.d.cts', {
      cwd,
    });
    const outputSourceMapFile = await globby('*.cjs.map', {
      cwd,
    });
    expect(
      outputDeclarationFile.length === 3 &&
        outputCjsFile.length === 3 &&
        outputSourceMapFile.length === 3,
    ).toBeTruthy();
    const content = await fs.readFile(path.join(cwd, 'index.cjs'), 'utf-8');
    expect(
      content.includes('./common.cjs') &&
        content.includes('//# sourceMappingURL=index.cjs.map'),
    ).toBeTruthy();

    const esmContent = await fs.readFile(
      path.join(fixtureDir, 'dist/esm', 'index.js'),
      'utf-8',
    );
    expect(esmContent.includes('./common.js')).toBeTruthy();
  });
});
