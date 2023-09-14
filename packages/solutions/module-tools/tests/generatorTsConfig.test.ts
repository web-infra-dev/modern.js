import { resolve } from 'path';
import { fs } from '@modern-js/utils';
import { generatorTsConfig } from '../src/utils/dts';

describe('utils', () => {
  it('generatorTsConfig', async () => {
    const appDirectory = resolve(__dirname, 'fixtures/example');
    const tsconfigPath = resolve(appDirectory, 'tsconfig.json');
    const sourceDir = resolve(appDirectory, 'src');
    const distAbsPath = resolve(appDirectory, 'dist');
    const {
      generatedTsconfig: { tempTsconfigPath },
    } = await generatorTsConfig({
      appDirectory,
      distAbsPath,
      tsconfigPath,
      watch: false,
      sourceDir,
      alias: {},
    });
    const content = await fs.readFile(tempTsconfigPath, 'utf8');
    console.log(content);
    expect(content.includes('references')).toBeTruthy();
    await fs.remove(tempTsconfigPath);
  });
});
