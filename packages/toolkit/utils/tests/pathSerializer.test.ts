import {
  applyMatcherReplacement,
  applyPathMatcher,
  matchUpwardPathsAsUnknown,
} from '../src/pathSerializer';

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

describe('applyPathMatcher', () => {
  it('should apply path matcher', () => {
    expect(applyPathMatcher({ match: '/a/b', mark: 'temp' }, '/a/b/c/d')).toBe(
      '<TEMP>/c/d',
    );
    expect(applyPathMatcher({ match: 'b/c', mark: 'inner' }, '/a/b/c/d')).toBe(
      '/a/<INNER>/d',
    );
  });
  it('should apply multiple path matcher', () => {
    expect(
      applyMatcherReplacement(
        [
          { match: '/a/b', mark: 'temp' },
          { match: 'd/e', mark: 'inner' },
        ],
        '/a/b/c/d/e/f',
      ),
    ).toBe('<TEMP>/c/<INNER>/f');
  });
});
