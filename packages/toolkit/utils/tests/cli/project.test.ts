import { isVersionBeyond17 } from '../../src/cli/is/project';

describe('isVersionBeyondReact17', () => {
  test('should return true for version 17 and above', () => {
    expect(isVersionBeyond17('17.0.0')).toBe(true);
    expect(isVersionBeyond17('17.0.1')).toBe(true);
    expect(isVersionBeyond17('17.0.1-canary')).toBe(true);
    expect(isVersionBeyond17('^17.0.0')).toBe(true);
    expect(isVersionBeyond17('~18.2.0')).toBe(true);
    expect(isVersionBeyond17('18.3.0-canary')).toBe(true);
  });

  test('should return false for below version 17', () => {
    expect(isVersionBeyond17('16.14.0')).toBe(false);
    expect(isVersionBeyond17('16.8.0-alpha-1')).toBe(false);
    expect(isVersionBeyond17('^16.0.0')).toBe(false);
    expect(isVersionBeyond17('~15.0.0')).toBe(false);
  });
});
