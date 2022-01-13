import * as path from 'path';
import * as babel from '@babel/core';
import { importCheck } from '../src/built-in/import-check';

describe('test build-in plugins', () => {
  it(`should output error message with 'styles' dir`, () => {
    const projectDir = path.join(__dirname, './fixtures/import-check');
    const filePath = path.join(projectDir, './src/index.ts');
    const babelPlugin = [importCheck(), { appDirectory: projectDir }];
    let errorMessage = '';
    try {
      babel.transformFileSync(filePath, {
        plugins: [babelPlugin],
      });
    } catch (e: any) {
      errorMessage = e.toString();
    }
    expect(errorMessage).toContain(
      `Importing files in 'styles' directory is not allowed`,
    );
  });

  it(`should output error message with 'src' dir`, () => {
    const projectDir = path.join(__dirname, './fixtures/import-check');
    const filePath = path.join(projectDir, './src/common.ts');
    const babelPlugin = [importCheck(), { appDirectory: projectDir }];
    let errorMessage = '';

    try {
      babel.transformFileSync(filePath, {
        plugins: [babelPlugin],
      });
    } catch (e: any) {
      errorMessage = e.toString();
    }

    expect(errorMessage).toContain(
      `Importing files outside of 'src' directory is not allowed`,
    );
  });
});
