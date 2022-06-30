import {
  padSpaceWith,
  InternalBuildError,
} from '../../src/features/build/error';

describe('padSpaceWith', () => {
  test(`str is 'hello', target length is 6, endStr is '.'`, () => {
    expect(padSpaceWith('hello', 6, { endStr: '.' })).toBe('hello.');
  });

  test(`str is 'hello', target length is 10, endStr is '.'`, () => {
    expect(padSpaceWith('hello', 10, { endStr: '.' })).toBe('hello    .');
  });

  test(`str is 'hello', target length is 5, endStr is '.'`, () => {
    expect(padSpaceWith('hello', 5, { endStr: '.' })).toBe('hello');
  });

  test(`str is 'hello', target length is 5, endStr is ''`, () => {
    expect(padSpaceWith('hello', 5, { endStr: '' })).toBe('hello');
  });

  test(`str is 'hello', target length is 10, endStr is '.', style is s => s + ' world'`, () => {
    expect(
      padSpaceWith('hello', 6, { endStr: '.', style: s => `${s} world` }),
    ).toBe('hello world.');
  });
});

describe('InternalBuildError', () => {
  test('buildType is bundle', () => {
    const e = new Error('this is error');
    e.stack = '';
    const ie = new InternalBuildError(e, {
      buildType: 'bundle',
      format: 'cjs',
      target: 'es2015',
    });
    expect(ie.formatError()).toBeDefined();
  });

  test('buildType is bundleless', () => {
    const e = new Error('this is error');
    e.stack = '';
    const ie = new InternalBuildError(e, {
      buildType: 'bundleless',
      format: 'cjs',
      target: 'es2015',
    });
    expect(ie.formatError()).toBeDefined();
  });
});
