import { getPackageVersion, canUseNpm, canUsePnpm, canUseYarn } from '@/index';

describe('test generator utils', () => {
  test('test getPackageVersion', async () => {
    const version = await getPackageVersion('lodash');
    expect(typeof version === 'string').toBe(true);
  });
  test('test canUseNpm', async () => {
    const npmAbility = await canUseNpm();
    expect(typeof npmAbility === 'boolean').toBe(true);
  });
  test('test canUsePnpm', async () => {
    const pnpmAbility = await canUsePnpm();
    expect(typeof pnpmAbility === 'boolean').toBe(true);
  });
  test('test canUseYarn', async () => {
    const yarnAbility = await canUseYarn();
    expect(typeof yarnAbility === 'boolean').toBe(true);
  });
});
