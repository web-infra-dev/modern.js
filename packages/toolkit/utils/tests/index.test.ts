import { canUseNpm, canUsePnpm, canUseYarn } from '../src';

jest.setTimeout(40000);

describe('test generator utils', () => {
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
