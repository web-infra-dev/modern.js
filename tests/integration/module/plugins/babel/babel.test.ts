import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from '../../fixtures/utils';

initBeforeTest();

describe('plugin-babel', () => {
  const fixtureDir = __dirname;
  it('preset-env', async () => {
    await runCli({
      argv: ['build'],
      appDirectory: fixtureDir,
    });
    const outFile = fs.readFileSync(
      path.resolve(__dirname, 'dist/index.js'),
      'utf8',
    );
    expect(outFile).toContain('_regeneratorRuntime');
  });
});
