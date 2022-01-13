import path from 'path';
import { ensureAbsolutePath } from '../src/ensureAbsolutePath';

describe('ensure absolute file path', () => {
  test('should return filePath directly', () => {
    expect(
      path.isAbsolute(ensureAbsolutePath('/a/b', '/a/b/c/d/e.jsx')),
    ).toBeTruthy();
  });

  test(`should resolve absolute path`, () => {
    expect(
      path.isAbsolute(ensureAbsolutePath('/a/b', 'c/d/e.jsx')),
    ).toBeTruthy();
  });
});
