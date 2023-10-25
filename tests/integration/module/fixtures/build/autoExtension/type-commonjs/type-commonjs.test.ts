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
    const cwd = path.join(fixtureDir, 'dist');
    const outputDeclarationFile = await globby('*.d.mts', {
      cwd,
    });
    const outputCjsFile = await globby('*.d.mts', {
      cwd,
    });
    expect(
      outputDeclarationFile.length === 3 && outputCjsFile.length === 3,
    ).toBeTruthy();
    const content = await fs.readFile(path.join(cwd, 'index.mjs'), 'utf-8');
    expect(content.includes('./common.mjs'));
  });
});
