import { getPackageVersion } from '../src/index';

describe('test generator utils', () => {
  test('test getPackageVersion', async () => {
    const version = await getPackageVersion('lodash');
    expect(typeof version === 'string').toBe(true);
  });
});
