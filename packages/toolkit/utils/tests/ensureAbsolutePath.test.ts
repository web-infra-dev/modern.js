import { ensureAbsolutePath } from '@/ensureAbsolutePath';

describe('ensure absolute file path', () => {
  test('should return filePath directly', () => {
    expect(ensureAbsolutePath('/a/b', '/a/b/c/d/e.jsx')).toEqual(
      '/a/b/c/d/e.jsx',
    );
  });

  test(`should resolve absolute path`, () => {
    expect(ensureAbsolutePath('/a/b', 'c/d/e.jsx')).toEqual('/a/b/c/d/e.jsx');
  });
});
