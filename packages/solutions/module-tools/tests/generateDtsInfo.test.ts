import { resolve } from 'path';
import { fs } from '@modern-js/utils';
import { generateDtsInfo } from '../src/utils/dts';

describe('utils', () => {
  it('generateDtsInfo', async () => {
    const appDirectory = resolve(__dirname, 'fixtures/example');
    const tsconfigPath = resolve(appDirectory, 'tsconfig.json');
    const sourceDir = resolve(appDirectory, 'src');
    const distPath = resolve(appDirectory, 'dist');
    const { tempTsconfigPath } = await generateDtsInfo({
      appDirectory,
      distPath,
      tsconfigPath,
      watch: false,
      sourceDir,
      alias: {},
      // not influence the result
      footer: '',
      banner: '',
      externals: [],
      input: [],
      respectExternal: true,
    });
    const content = await fs.readFile(tempTsconfigPath, 'utf8');
    expect(content.includes('references')).toBeTruthy();
    await fs.remove(tempTsconfigPath);
  });
});
