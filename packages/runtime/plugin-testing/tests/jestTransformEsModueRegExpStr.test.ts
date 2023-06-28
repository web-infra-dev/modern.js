import { getJestTransformEsModulesRegStr } from '../src/cli';

describe('Jest transform esModules RegExp String ', () => {
  const r = new RegExp(getJestTransformEsModulesRegStr());
  it('In pnpm project', () => {
    expect(r.test('node_modules/.pnpm/@modern-js+runtime@0.0.0')).toBeFalsy();
    expect(r.test('node_modules/.pnpm/@modern-js+plugin@0.0.0')).toBeFalsy();
    expect(
      r.test('node_modules/.pnpm/@modern-js-reduck+store@0.0.0'),
    ).toBeFalsy();
    expect(
      r.test('node_modules/.pnpm/@modern-js-reduck+plugin-effects@0.0.0'),
    ).toBeFalsy();
    expect(r.test('node_modules/apnpm/@modern-js+runtime@0.0.0')).toBeTruthy();
    expect(r.test('node_modules/.pnpm/webpack')).toBeTruthy();
  });

  it('In npm or yarn@1 project', () => {
    expect(r.test('node_modules/@modern-js/runtime')).toBeFalsy();
    expect(r.test('node_modules/@modern-js/plugin')).toBeFalsy();
    expect(r.test('node_modules/@modern-js-reduck/store')).toBeFalsy();
    expect(r.test('node_modules/@modern-js-reduck/plugin-effects')).toBeFalsy();
    expect(r.test('node_modules/webpack')).toBeTruthy();
  });
});
