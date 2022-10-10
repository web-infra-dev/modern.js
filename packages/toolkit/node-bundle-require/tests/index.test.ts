import path, { dirname } from 'path';
import { fs } from '@modern-js/utils';
import { bundleRequire } from '../src';
import { EXTERNAL_REGEXP } from '../src/bundle';

describe('bundleRequire', () => {
  test('should bundle file with `__filename` correctly', async () => {
    const result = await bundleRequire(
      path.join(__dirname, './fixture/input.ts'),
    );
    // when tsconfig.json sets `compilerOptions.target` to `es5`
    // normally it will met error
    // So we need to manually set esbuild's target to esnext to avoid that
    // These two cases above use ES6+ ability, to test whether esbuild successfully
    // works on non-ES5 files
    // reference: https://github.com/evanw/esbuild/releases/tag/v0.12.6
    expect(result.default.a.filename.endsWith('a.ts')).toEqual(true);
    expect(result.default.a.showFileName().endsWith('a.ts')).toEqual(true);
  });

  test('should bundle ts files inside node_modules correctly', async () => {
    const symlinkFrom = path.join(__dirname, './fixture/package-foo');
    const symlinkTo = path.join(__dirname, '../node_modules/package-foo');

    if (!fs.existsSync(symlinkTo)) {
      fs.ensureDirSync(dirname(symlinkTo));
      fs.symlinkSync(symlinkFrom, symlinkTo);
    }

    const result = await bundleRequire(
      path.join(__dirname, './fixture/input-with-ts.ts'),
    );

    expect(result.default).toEqual({ bar: 1 });

    fs.unlinkSync(symlinkTo);
  });
});

describe('external regexp', () => {
  expect(EXTERNAL_REGEXP.test('./test')).toBeFalsy();
  expect(EXTERNAL_REGEXP.test('/test')).toBeFalsy();
  expect(EXTERNAL_REGEXP.test('c:/foo')).toBeTruthy();
  expect(EXTERNAL_REGEXP.test('C:/foo')).toBeTruthy();
  expect(EXTERNAL_REGEXP.test('c:/node_modules/foo')).toBeTruthy();
  expect(EXTERNAL_REGEXP.test('foo')).toBeTruthy();
  expect(EXTERNAL_REGEXP.test('/test/node_modules')).toBeFalsy();
});
