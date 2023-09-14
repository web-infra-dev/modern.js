import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from '../../../utils';

initBeforeTest();

describe('tailwindcss', () => {
  const fixtureDir = __dirname;
  it('tailwindcss usage', async () => {
    await runCli({
      argv: ['build'],
      appDirectory: fixtureDir,
      enableTailwindCss: true,
    });

    const content1 = await fs.readFile(
      path.join(fixtureDir, './dist/function/style.css'),
      'utf8',
    );
    const content2 = await fs.readFile(
      path.join(fixtureDir, './dist/object/style.css'),
      'utf8',
    );
    expect(content1.includes('0 0 0') && content1 === content2).toBeTruthy();
  });

  it('design system', async () => {
    await runCli({
      argv: ['build'],
      appDirectory: fixtureDir,
      enableTailwindCss: true,
      configFile: 'design-system.config.ts',
    });

    const content = await fs.readFile(
      path.join(fixtureDir, './dist/design-system/style.css'),
      'utf8',
    );
    expect(content.includes('0 0 0')).toBeTruthy();
  });
});
