import { getCoreJsVersion } from '../src/utils';

describe('getCoreJsVersion', () => {
  it('should get correct core-js version', () => {
    expect(getCoreJsVersion()).toEqual('3.26');
  });
});
