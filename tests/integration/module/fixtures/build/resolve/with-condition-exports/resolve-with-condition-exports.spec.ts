import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from '../../../utils';

initBeforeTest();

describe('resovle', () => {
  const fixtureDir = __dirname;
  it('with-condition-exports: browser', async () => {
    const { success } = await runCli({
      argv: ['build'],
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();
    const outDir = path.join(fixtureDir, 'dist/browser');
    const entry1 = path.join(outDir, 'entry1.js');
    const entry2 = path.join(outDir, 'entry2.js');
    const entry3 = path.join(outDir, 'entry3.js');
    const entry4 = path.join(outDir, 'entry4.js');
    const content1 = await fs.readFile(entry1, 'utf-8');
    const content2 = await fs.readFile(entry2, 'utf-8');
    const content3 = await fs.readFile(entry3, 'utf-8');
    const content4 = await fs.readFile(entry4, 'utf-8');
    // import
    expect(content1).toContain('lib1 mjs');
    // module
    expect(content2).toContain('lib2 module');
    expect(content3).toContain('browser');
    // require
    expect(content4).toContain('lib1 cjs');
  });

  it('with-condition-exports: node', async () => {
    const { success } = await runCli({
      argv: ['build'],
      appDirectory: fixtureDir,
      configFile: 'modern-node.config.ts',
    });
    expect(success).toBeTruthy();
    const outDir = path.join(fixtureDir, 'dist/node');
    const entry3 = path.join(outDir, 'entry3.js');
    const content3 = await fs.readFile(entry3, 'utf-8');
    expect(content3).toContain('node');
  });
});
