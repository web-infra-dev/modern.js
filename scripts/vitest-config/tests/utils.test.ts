import path from 'path';
import { describe, expect, it, vi } from 'vitest';
import { createSnapshotSerializer } from '../src/utils';

describe('createSnapshotSerializer', () => {
  it.each([
    ['/a/b/c/d/e/f/g', '"<ROOT>/d/e/f/g"'],
    ['/a/b/c/foo', '"<ROOT>/foo"'],
    ['/a/b/foo/bar', '"<UNKNOWN>/foo/bar"'],
    [
      '/a/b/c/node_modules/.pnpm/babel-loader@8.2.5_2cad51bbe9c2876396f118aa6395be78/node_modules/babel-loader/lib/index.js',
      '"<ROOT>/node_modules/<PNPM_INNER>/babel-loader/lib/index.js"',
    ],
  ])('should handle with posix path %s', (value, expected) => {
    const serializer = createSnapshotSerializer({
      cwd: '/a/b/c',
      workspace: '/a/b/c/d',
      replace: [{ match: '/a/b/c/d/e', mark: 'workspace2' }],
    });
    expect(serializer.test(value)).toBe(true);
    expect(serializer.print(value)).toBe(expected);
  });
  it.each([
    ['A:\\b\\c\\d\\e\\f\\g', '"<ROOT>/d/e/f/g"'],
    ['A:\\b\\c\\foo', '"<ROOT>/foo"'],
    ['A:\\b\\foo\\bar', '"<UNKNOWN>/foo/bar"'],
    ['Z:\\b\\c\\foo', '"/z/b/c/foo"'],
  ])('should handle with windows path %s', (value, expected) => {
    if (process.platform !== 'win32') {
      // will take the error `Maximum call stack size exceeded` in windows & node 16
      vi.spyOn(path, 'resolve').mockImplementation(path.win32.resolve);
      vi.spyOn(path, 'normalize').mockImplementation(path.win32.normalize);
    }
    const serializer = createSnapshotSerializer({
      cwd: 'A:\\b\\c',
      workspace: 'A:\\b\\c\\d',
      replace: [{ match: 'A:\\b\\c\\d\\e', mark: 'workspace2' }],
    });
    expect(serializer.test(value)).toBe(true);
    expect(serializer.print(value)).toBe(expected);
  });
});
