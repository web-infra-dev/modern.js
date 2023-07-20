import path from 'path';

import mapToRelative from '../src/mapToRelative';

let originalCwd = process.cwd();
beforeAll(() => {
  originalCwd = process.cwd();
  process.chdir(path.resolve(__dirname, '../'));
});

afterAll(() => {
  process.chdir(originalCwd);
});

describe('mapToRelative', () => {
  describe('should map to relative path with a custom cwd', () => {
    it('with a relative filename', () => {
      const currentFile = './utils/test/file.js';
      const result = mapToRelative(
        path.resolve('./test'),
        currentFile,
        'utils/dep',
      );

      expect(result).toBe('../dep');
    });

    it('with an absolute filename', () => {
      const currentFile = path.resolve('./utils/test/file.js');
      const result = mapToRelative(path.resolve('.'), currentFile, 'utils/dep');

      expect(result).toBe('../dep');
    });
  });
});
