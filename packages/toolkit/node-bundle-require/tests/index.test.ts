import path from 'path';
import { bundleRequire, EXTERNAL_REGEXP } from '../src';

test('require', async () => {
  const result = await bundleRequire(
    path.join(__dirname, './fixture/input.ts'),
  );
  expect(result.default.a.filename.endsWith('a.ts')).toEqual(true);
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
