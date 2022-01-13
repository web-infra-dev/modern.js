import path from 'path';
import { findExists } from '../src/findExists';

describe('find first exists file', () => {
  const fixturePath = path.resolve(__dirname, './fixtures/file-exists');

  test('should return file path', () => {
    expect(
      findExists(
        ['.js', '.ts', '.ejs', '.mjs'].map(ext =>
          path.join(fixturePath, `a${ext}`),
        ),
      ),
    ).toEqual(path.join(fixturePath, 'a.ts'));
  });

  test('should return false when no file exists', () => {
    expect(
      findExists(['.jsx'].map(ext => path.join(fixturePath, `a${ext}`))),
    ).toBe(false);
  });
});
