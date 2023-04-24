import { PackagePathRegex } from '../src/common/packagePath';

describe('packagePath regex test', () => {
  it('only one path', () => {
    expect(PackagePathRegex.test('app')).toBe(true);
  });
  it('path end with /', () => {
    expect(PackagePathRegex.test('app/test/')).toBe(true);
  });
  it('path with invalid character', () => {
    expect(PackagePathRegex.test('app/test?:')).toBe(false);
  });
  it('path with _ and -', () => {
    expect(PackagePathRegex.test('app/test-2')).toBe(true);
    expect(PackagePathRegex.test('app/test_2')).toBe(true);
  });
});
