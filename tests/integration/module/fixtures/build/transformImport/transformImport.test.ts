import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from '../../utils';

initBeforeTest();

describe('transformImport', () => {
  const fixtureDir = __dirname;
  it('import style', async () => {
    await runCli({
      argv: ['build'],
      configFile: path.join(fixtureDir, 'modern.config.ts'),
      appDirectory: fixtureDir,
    });
    const outFile = fs.readFileSync(
      path.resolve(__dirname, 'dist/index.js'),
      'utf8',
    );
    expect(outFile).toContain('es/button/style');
  });
});
