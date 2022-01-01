import * as path from 'path';
import * as babel from '@babel/core';
import { aliasPlugin } from '../src/plugins/alias';

describe('test alias', () => {
  it(`change nothing for '.' and './' path`, () => {
    const projectDir = path.join(__dirname, './fixtures/alias-current-path');
    const filePath = path.join(projectDir, './common.ts');
    const babelPlugin = aliasPlugin({
      absoluteBaseUrl: projectDir,
      isTsPath: true,
      isTsProject: true,
    });
    const ret = babel.transformFileSync(filePath, {
      plugins: [babelPlugin],
    });
    if (ret) {
      const expectValue = ret.code?.includes(`import { counts } from ".";`);
      expect(expectValue).toBe(true);
    } else {
      expect(0).toBe('build fail');
    }
  });
});
