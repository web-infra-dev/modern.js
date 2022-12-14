import { getCoreJsVersion } from '@modern-js/utils';

describe('getCoreJsVersion', () => {
  it('should get correct core-js version', () => {
    expect(getCoreJsVersion(require.resolve('core-js/package.json'))).toEqual(
      '3.26',
    );
  });
});
