import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from '../../fixtures/utils';

initBeforeTest();

describe('plugin-node-polyfill', () => {
  const fixtureDir = __dirname;
  it('inject global', async () => {
    await runCli({
      argv: ['build'],
      appDirectory: fixtureDir,
    });
    const outFile = fs.readFileSync(
      path.resolve(__dirname, 'dist/index.js'),
      'utf8',
    );
    expect(outFile).toContain('require_globals');
  });
});
