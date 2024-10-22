import path from 'path';
import { fs } from '@modern-js/utils';
import { initBeforeTest, runCli } from '../../fixtures/utils';

initBeforeTest();

describe('plugin-node-polyfill', () => {
  const fixtureDir = __dirname;
  it('inject global', async () => {
    await runCli({
      argv: ['build'],
      appDirectory: fixtureDir,
    });
    const content = fs.readFileSync(
      path.resolve(__dirname, 'dist/index.js'),
      'utf8',
    );
    expect(content).toContain('init_globals()');
    expect(content).toContain('__toESM(require_browser2())');
    expect(content).toContain('__toESM(require_path_browserify())');
  });
});
