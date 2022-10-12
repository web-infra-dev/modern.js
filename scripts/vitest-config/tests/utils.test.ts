import path from 'path';
import { describe, expect, it, vi } from 'vitest';
import {
  compilePathMatcherRegExp,
  createSnapshotSerializer,
  joinPathParts,
  matchUpwardPathsAsUnknown,
  upwardPaths,
} from '../src/utils';

describe('joinPathParts', () => {
  it('should join path parts', () => {
    expect(joinPathParts('whatever', 0, ['a', 'b', 'c'])).toBe('/a');
    expect(joinPathParts('whatever', 1, ['a', 'b', 'c'])).toBe('/a/b');
    expect(joinPathParts('whatever', 2, ['a', 'b', 'c'])).toBe('/a/b/c');
  });
});

describe('upwardPaths', () => {
  it('should get upward paths', () => {
    expect(upwardPaths('/a/b/c')).toEqual(['/a/b/c', '/a/b', '/a', '/']);
  });
});

describe('compilePathMatcherSource', () => {
  it('should compile string path matcher', () => {
    const regExp = compilePathMatcherRegExp('/a/b/c');
    expect(regExp.source).toBe('^\\/a\\/b\\/c(?=\\/)|^\\/a\\/b\\/c$');
    expect(regExp.test('/a/b/c')).toBe(true);
    expect(regExp.test('/a/b/c/')).toBe(true);
    expect(regExp.test('/a/b/c/d')).toBe(true);
    expect(regExp.test('/a/b/cd')).toBe(false);
    expect(regExp.test('/a/c/c/')).toBe(false);
  });
});

describe('matchUpwardPathsAsUnknown', () => {
  it('should match upward paths', () => {
    expect(matchUpwardPathsAsUnknown('/a/b/c')).toEqual([
      { mark: 'unknown', match: '/a/b' },
      { mark: 'unknown', match: '/a' },
    ]);
  });
  it('should match upward paths with win32', () => {
    expect(matchUpwardPathsAsUnknown('C:\\Windows\\User\\workspace')).toEqual([
      { mark: 'unknown', match: '/c/Windows/User' },
      { mark: 'unknown', match: '/c/Windows' },
      { mark: 'unknown', match: '/c' },
    ]);
  });
});

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
      replace: [
        { match: '/a/b/c', mark: 'root' },
        { match: '/a/b/c/d', mark: 'workspace' },
        { match: '/a/b/c/d/e', mark: 'workspace2' },
      ],
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
      replace: [
        { match: 'A:\\b\\c', mark: 'root' },
        { match: 'A:\\b\\c\\d', mark: 'workspace' },
        { match: 'A:\\b\\c\\d\\e', mark: 'workspace2' },
      ],
    });
    expect(serializer.test(value)).toBe(true);
    expect(serializer.print(value)).toBe(expected);
  });
});
