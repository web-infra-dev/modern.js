import * as path from 'path';
import * as babel from '@babel/core';
import importPath from '../src/built-in/import-path';

describe('test alias', () => {
  it(`should solve static file path`, () => {
    const projectDir = path.join(__dirname, './fixtures/import-path');
    const filePath = path.join(projectDir, './src/index.ts');
    const babelPlugin = [importPath(), { appDirectory: projectDir }];
    const ret = babel.transformFileSync(filePath, {
      plugins: [babelPlugin],
    });
    if (ret) {
      // TODO: window test
      // expect(ret.code).toMatchSnapshot();
      expect(ret.code).not.toBe('');
    } else {
      expect(0).toBe('build fail');
    }
  });
});
