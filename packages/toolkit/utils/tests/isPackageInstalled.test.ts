import { isPackageInstalled } from '../src/tryResolve';

describe('isPackageInstalled', () => {
  it('should return false if the package not is resolved', () => {
    expect(isPackageInstalled('@foo/bar', __dirname)).toBeFalsy();
  });

  it('should return true if the package is resolved', () => {
    expect(isPackageInstalled('lodash', __dirname)).toBeTruthy();
  });
});
