import * as path from 'path';
import { getRelativeRuntimePath } from '../src/utils';

describe('getRelativeRuntimePath', () => {
  it('should return relative path', () => {
    const appDirectory = '/Users/user/project';
    const runtimePath =
      '/Users/user/project/node_modules/.modern-js/.runtime-exports/server.js';
    const relativePath = getRelativeRuntimePath(appDirectory, runtimePath);
    expect(path.normalize(relativePath)).toBe(
      path.normalize('./node_modules/.modern-js/.runtime-exports/server.js'),
    );
  });
});
