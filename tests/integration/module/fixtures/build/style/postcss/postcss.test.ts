import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from '../../../utils';

initBeforeTest();

describe('postcss', () => {
  const fixtureDir = __dirname;
  it('postcss function usage', async () => {
    await runCli({
      argv: ['build'],
      appDirectory: fixtureDir,
    });

    const content1 = await fs.readFile(
      path.join(fixtureDir, './dist/function/style.css'),
      'utf8',
    );
    const content2 = await fs.readFile(
      path.join(fixtureDir, './dist/object/style.css'),
      'utf8',
    );
    expect(
      content1.includes('font-size: 16px;') &&
        content1.includes('background: white;'),
    ).toBeTruthy();
    expect(content1 === content2).toBeTruthy();
  });
});
