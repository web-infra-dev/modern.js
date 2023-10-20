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
    const map = fs.readFileSync(
      path.resolve(__dirname, 'dist/index.js.map'),
      'utf8',
    );
    expect(outFile).toContain('_regeneratorRuntime');
    expect(JSON.parse(map).sources[0]).toBe('../src/index.js');
  });
});
