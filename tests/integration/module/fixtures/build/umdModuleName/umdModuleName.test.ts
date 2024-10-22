import path from 'path';
import { fs } from '@modern-js/utils';
import { initBeforeTest, runCli } from '../../utils';

initBeforeTest();

describe('umdModuleName usage', () => {
  const fixtureDir = __dirname;
  it(`build success`, async () => {
    const configFile = path.join(fixtureDir, './config.ts');
    const ret = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });

    expect(ret.success).toBeTruthy();
    const distFilePath = path.join(fixtureDir, './dist/index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    // refre: https://github.com/babel/babel/blob/main/packages/babel-types/src/converters/toIdentifier.ts
    expect(content.includes('global.demo')).toBeTruthy();
  });
});
