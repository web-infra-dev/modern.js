import { ensureAbsolutePath } from '@/ensureAbsolutePath';

describe('ensure absolute file path', () => {
  test('should return filePath directly', () => {
    expect(
      ensureAbsolutePath('/a/b', '/a/b/c/d/e.jsx').endsWith('/a/b/c/d/e.jsx'),
    ).toBeTruthy();
  });

  test(`should resolve absolute path`, () => {
    expect(
      ensureAbsolutePath('/a/b', 'c/d/e.jsx').endsWith('/a/b/c/d/e.jsx'),
    ).toBeTruthy();
  });
});
