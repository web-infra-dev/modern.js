import { normalizePathname } from '../src/url';

describe('test ./src/url.ts', () => {
  it('should normalize path correctly', () => {
    let pathname = '/';

    expect(normalizePathname(pathname)).toBe('/');

    pathname = '/api';
    expect(normalizePathname(pathname)).toBe('/api');

    pathname = '/api/';
    expect(normalizePathname(pathname)).toBe('/api');

    pathname = '/a/b/c/d';
    expect(normalizePathname(pathname)).toBe('/a/b/c/d');

    pathname = '/a/b/c/d/';
    expect(normalizePathname(pathname)).toBe('/a/b/c/d');

    pathname = '//';
    expect(normalizePathname(pathname)).toBe('/');

    pathname = '/api//';
    expect(normalizePathname(pathname)).toBe('/api');
  });
});
