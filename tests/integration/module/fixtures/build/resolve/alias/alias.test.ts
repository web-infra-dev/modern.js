import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from '../../../utils';

initBeforeTest();

describe('resolve alias for module id', () => {
  const fixtureDir = __dirname;
  it('object usage', async () => {
    const bundleConfigFile = path.join(fixtureDir, './object.config.ts');
    const ret = await runCli({
      argv: ['build'],
      configFile: bundleConfigFile,
      appDirectory: fixtureDir,
    });

    expect(ret.success).toBe(true);

    const distFilePath = path.join(fixtureDir, './dist/object/index.js');
    expect(fs.existsSync(distFilePath)).toBe(true);
    const content = fs.readFileSync(distFilePath, 'utf-8');
    expect(content.includes('react-native')).toBe(true);
  });

  it('function usage', async () => {
    const configFile = path.join(fixtureDir, './function.config.ts');
    const ret = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(ret.success).toBeTruthy();
    const distFilePath = path.join(fixtureDir, './dist/function/index.js');
    expect(fs.existsSync(distFilePath)).toBe(true);

    const content = fs.readFileSync(distFilePath, 'utf-8');
    expect(content.includes('react-native')).toBe(true);
  });
});
