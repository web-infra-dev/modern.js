import path from 'path';
import { fs } from '@modern-js/utils';
import { initBeforeTest, runCli } from '../../fixtures/utils';

initBeforeTest();

describe('plugin-polyfill', () => {
  const fixtureDir = __dirname;
  it('ie10', async () => {
    await runCli({
      argv: ['build'],
      appDirectory: fixtureDir,
    });
    const outFile = fs.readFileSync(
      path.resolve(__dirname, 'dist/index.js'),
      'utf8',
    );
    expect(outFile).toContain('core-js-pure');
  });
});
