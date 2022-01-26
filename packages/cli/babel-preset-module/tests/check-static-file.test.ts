import * as path from 'path';
import { isStaticFile } from '../src/built-in/import-path';

const projectDir = path.join(__dirname, './fixtures/check-static-file');

describe('check file is static file', () => {
  it(`should be static file for './index.less'`, () => {
    const filename = path.join(projectDir, './index.less');
    expect(isStaticFile(filename, projectDir)).toBe(true);
  });

  it(`should be static file for './index.png'`, () => {
    const filename = path.join(projectDir, './index.png');
    expect(isStaticFile(filename, projectDir)).toBe(true);
  });

  it(`should be not static file for './index.ts'`, () => {
    const filename = path.join(projectDir, './index.ts');
    expect(isStaticFile(filename, projectDir)).toBe(false);
  });

  it(`should be not static file for 'import './index.main.ts'`, () => {
    const filename = path.join(projectDir, './index.main.ts');
    expect(isStaticFile(filename, projectDir)).toBe(false);
  });
});
