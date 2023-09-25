import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from '../../utils';

initBeforeTest();

const fixtureDir = __dirname;

describe('jsx', () => {
  it('automatic', async () => {
    const configFile = path.join(fixtureDir, './automatic.config.ts');
    const ret = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });

    expect(ret.success).toBeTruthy();
    const distFilePath = path.join(fixtureDir, './dist/automatic/index.js');
    const content = await fs.readFile(distFilePath, 'utf8');
    expect(content.includes('react/jsx-runtime')).toBeTruthy();
  });

  it('transform', async () => {
    const configFile = path.join(fixtureDir, './transform.config.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    const distFilePath = path.join(fixtureDir, './dist/transform/index.js');
    const content = await fs.readFile(distFilePath, 'utf8');
    expect(content.includes('React.createElement')).toBeTruthy();
  });

  it('preserve', async () => {
    const configFile = path.join(fixtureDir, './preserve.config.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    const distFilePath = path.join(fixtureDir, './dist/preserve/index.js');
    const content = await fs.readFile(distFilePath, 'utf8');
    expect(content.includes('<div>')).toBeTruthy();
  });
});
