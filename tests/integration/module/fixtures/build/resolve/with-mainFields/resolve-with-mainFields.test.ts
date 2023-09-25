import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from '../../../utils';

initBeforeTest();

describe('resovle', () => {
  const fixtureDir = __dirname;
  it('with-condition-exports', async () => {
    const { success } = await runCli({
      argv: ['build'],
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();
    const browserContent = fs.readFileSync(
      path.join(__dirname, 'dist/browser/entry2.js'),
      'utf8',
    );
    expect(browserContent).toContain('browser');
    const nodeContent = fs.readFileSync(
      path.join(__dirname, 'dist/node/entry2.js'),
      'utf8',
    );
    expect(nodeContent).toContain('main');
  });
});
