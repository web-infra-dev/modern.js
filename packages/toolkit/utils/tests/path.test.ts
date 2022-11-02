import {
  compilePathMatcherRegExp,
  upwardPaths,
  _joinPathParts,
} from '../src/path';

describe('upwardPaths', () => {
  it('should get upward paths', () => {
    expect(upwardPaths('/a/b/c')).toEqual(['/a/b/c', '/a/b', '/a', '/']);
  });
});

describe('joinPathParts', () => {
  it('should join path parts', () => {
    expect(_joinPathParts('whatever', 0, ['a', 'b', 'c'])).toBe('/a');
    expect(_joinPathParts('whatever', 1, ['a', 'b', 'c'])).toBe('/a/b');
    expect(_joinPathParts('whatever', 2, ['a', 'b', 'c'])).toBe('/a/b/c');
  });
});

describe('compilePathMatcherRegExp', () => {
  it('should compile string path matcher', () => {
    const regExp = compilePathMatcherRegExp('/a/b/c', { withBoundary: true });
    expect(regExp.source).toBe('^\\/a\\/b\\/c(?=\\/)|^\\/a\\/b\\/c$');
    expect(regExp.test('/a/b/c')).toBe(true);
    expect(regExp.test('/a/b/c/')).toBe(true);
    expect(regExp.test('/a/b/c/d')).toBe(true);
    expect(regExp.test('/a/b/cd')).toBe(false);
    expect(regExp.test('/a/c/c/')).toBe(false);
    const regExp2 = compilePathMatcherRegExp('/a/b/c', { withBoundary: false });
    expect(regExp.source).toBe('\\/a\\/b\\/c');
    expect(regExp2.test('at async (/a/b/c)')).toBe(true);
  });
});
