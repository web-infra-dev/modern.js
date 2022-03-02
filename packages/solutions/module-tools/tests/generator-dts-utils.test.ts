import * as path from 'path';
import { generatorTsConfig } from '../src/tasks/generator-dts/utils';

describe('test generator dts utils', () => {
  it('test generatorTsConfig', () => {
    const appDir = path.join(__dirname, './fixtures/tsconfig');
    const ret = generatorTsConfig({}, { appDirectory: appDir, distDir: '' });
    expect(ret).toContain('tsconfig.temp.json');
  });
});
