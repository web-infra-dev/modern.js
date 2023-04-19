import { describe, expect, it } from 'vitest';
import { withPublicPath } from '@/url';

const PUBLIC_PATH = 'https://www.example.com/static';

describe('withPublicPath', () => {
  it('should handle relative url', () => {
    expect(withPublicPath('foo/bar.js', PUBLIC_PATH)).toBe(
      'https://www.example.com/static/foo/bar.js',
    );
    expect(withPublicPath('foo/bar.js', '/')).toBe('/foo/bar.js');
    expect(withPublicPath('./foo/bar.js', PUBLIC_PATH)).toBe(
      'https://www.example.com/static/foo/bar.js',
    );
    expect(withPublicPath('./foo/bar.js', '/')).toBe('/foo/bar.js');
  });

  it('should handle absolute url', () => {
    expect(withPublicPath('/foo/bar.js', PUBLIC_PATH)).toBe(
      'https://www.example.com/foo/bar.js',
    );
    expect(withPublicPath('/foo/bar.js', '/')).toBe('/foo/bar.js');
  });

  it('should handle absolute url with hostname & protocol', () => {
    expect(withPublicPath('http://foo.com/bar.js', PUBLIC_PATH)).toBe(
      'http://foo.com/bar.js',
    );
    expect(withPublicPath('http://foo.com/bar.js', '/')).toBe(
      'http://foo.com/bar.js',
    );
  });

  it('should handle absolute url with double slash', () => {
    expect(withPublicPath('//foo.com/bar.js', PUBLIC_PATH)).toBe(
      '//foo.com/bar.js',
    );
    expect(withPublicPath('//foo.com/bar.js', '/')).toBe('//foo.com/bar.js');
  });
});
