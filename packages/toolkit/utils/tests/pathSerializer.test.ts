import { matchUpwardPathsAsUnknown } from '../src/pathSerializer';

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
