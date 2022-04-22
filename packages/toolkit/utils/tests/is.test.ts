import {
  isSSR,
  isTest,
  isEmpty,
  isFastRefresh,
  isProdProfile,
  isUseSSRBundle,
} from '../src/is';

describe('validate', () => {
  it('should validate empty object correctly', () => {
    expect(isEmpty({})).toBeTruthy();
    expect(isEmpty({ foo: 'bar' })).toBeFalsy();
  });

  it('should validate fast refresh correctly', () => {
    const { NODE_ENV, FAST_REFRESH } = process.env;

    process.env.NODE_ENV = 'development';
    process.env.FAST_REFRESH = 'true';
    expect(isFastRefresh()).toBeTruthy();

    process.env.NODE_ENV = 'production';
    process.env.FAST_REFRESH = 'true';
    expect(isFastRefresh()).toBeFalsy();

    process.env.NODE_ENV = 'development';
    process.env.FAST_REFRESH = 'false';
    expect(isFastRefresh()).toBeFalsy();

    process.env.NODE_ENV = NODE_ENV;
    process.env.FAST_REFRESH = FAST_REFRESH;
  });

  it('should validate ssr config correctly', () => {
    expect(isSSR({})).toBeFalsy();

    expect(
      isSSR({
        server: { ssr: {} },
      }),
    ).toBeTruthy();

    expect(
      isSSR({
        server: {
          ssrByEntries: {
            'page-a': false,
          },
        },
      }),
    ).toBeFalsy();

    expect(
      isSSR({
        server: {
          ssrByEntries: {
            'page-a': true,
          },
        },
      }),
    ).toBeTruthy();
  });

  it('should validate ssr bundle correctly', () => {
    expect(isUseSSRBundle({})).toBeFalsy();

    expect(isUseSSRBundle({ output: { ssg: true } })).toBeTruthy();

    expect(
      isUseSSRBundle({
        server: { ssr: {} },
      }),
    ).toBeTruthy();
  });

  it('should validate prod profile correctly', () => {
    const { NODE_ENV } = process.env;
    const { argv } = process;

    process.argv = ['--profile'];
    process.env.NODE_ENV = 'development';
    expect(isProdProfile()).toBeFalsy();

    process.argv = [];
    process.env.NODE_ENV = 'production';
    expect(isProdProfile()).toBeFalsy();

    process.argv = ['--profile'];
    process.env.NODE_ENV = 'production';
    expect(isProdProfile()).toBeTruthy();

    process.argv = argv;
    process.env.NODE_ENV = NODE_ENV;
  });

  it('should validate test env correctly', () => {
    const { NODE_ENV } = process.env;

    process.env.NODE_ENV = 'test';
    expect(isTest()).toBeTruthy();

    process.env.NODE_ENV = 'production';
    expect(isTest()).toBeFalsy();

    process.env.NODE_ENV = NODE_ENV;
  });
});
