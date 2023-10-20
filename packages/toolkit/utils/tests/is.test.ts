import { isSSR, isTest, isEmpty, isUseSSRBundle, isSSGEntry } from '../src';

describe('validate', () => {
  it('should validate empty object correctly', () => {
    expect(isEmpty({})).toBeTruthy();
    expect(isEmpty({ foo: 'bar' })).toBeFalsy();
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

  it('should validate test env correctly', () => {
    const { NODE_ENV } = process.env;

    process.env.NODE_ENV = 'test';
    expect(isTest()).toBeTruthy();

    process.env.NODE_ENV = 'production';
    expect(isTest()).toBeFalsy();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should detect ssg config correctly', () => {
    const useSSG = isSSGEntry({ output: {} } as any, 'main', [
      { entryName: 'main' },
    ]);
    expect(useSSG).toBeFalsy();

    const useSSG1 = isSSGEntry({ output: { ssg: true } } as any, 'main', [
      { entryName: 'main' },
    ]);
    expect(useSSG1).toBeTruthy();

    const useSSG2 = isSSGEntry(
      { output: { ssg: { home: false } } } as any,
      'home',
      [{ entryName: 'main' }, { entryName: 'home' }],
    );
    expect(useSSG2).toBeFalsy();

    const useSSG3 = isSSGEntry(
      { output: { ssg: { home: {} } } } as any,
      'home',
      [{ entryName: 'main' }, { entryName: 'home' }],
    );
    expect(useSSG3).toBeTruthy();
  });
});
