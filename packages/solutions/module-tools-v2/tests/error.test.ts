import {
  padSpaceWith,
  InternalBuildError,
  InternalDTSError,
  isInternalError,
  ModuleBuildError,
} from '../src/error';

describe('error.ts', () => {
  it('padSpaceWith', () => {
    const source = 'hello world';
    expect(padSpaceWith(source, 4)).toBe(source);
    expect(padSpaceWith('aaa', 4)).toBe('aaa|');
    expect(padSpaceWith('aaa', 4, { style: s => `${s}a` })).toBe('aaaa|');
  });

  it('InternalBuildError', () => {
    const errorMessage = 'hello world';
    const error = new Error(errorMessage);
    const buildError = new InternalBuildError(error, {
      target: 'es6',
      format: 'esm',
      buildType: 'bundle',
    });
    const content = buildError.toString();
    expect(content.includes(errorMessage)).toBeTruthy();
    expect(content.includes(`- format is "esm"`)).toBeTruthy();
    expect(content.includes(`- target is "es6"`)).toBeTruthy();
  });

  it('InternalDTSError', () => {
    const errorMessage = 'hello world';
    const error = new Error(errorMessage);
    const dtsError = new InternalDTSError(error, {
      buildType: 'bundleless',
    });

    const content = dtsError.toString();
    expect(content.includes(errorMessage)).toBeTruthy();
    expect(content.includes(`DTS failed:`)).toBeTruthy();
  });

  it('execaError', () => {
    const errorMessage = 'hello world';
    const shortMessage = 'this is short message';
    const error = new Error(errorMessage);
    (error as any).stdout = {};
    (error as any).shortMessage = shortMessage;
    const dtsError = new InternalDTSError(error, {
      buildType: 'bundleless',
    });

    const content = dtsError.toString();

    expect(content.includes(errorMessage)).toBeTruthy();
    expect(content.includes(shortMessage)).toBeFalsy();
    expect(content.includes(`DTS failed:`)).toBeTruthy();
  });

  it('isInternalError', () => {
    expect(
      isInternalError(
        new InternalDTSError(new Error('helle world'), {
          buildType: 'bundle',
        }),
      ),
    ).toBeTruthy();

    expect(
      isInternalError(
        new InternalBuildError(new Error('helle world'), {
          buildType: 'bundle',
          format: 'cjs',
          target: 'es2016',
        }),
      ),
    ).toBeTruthy();

    expect(isInternalError(new Error())).toBeFalsy();
  });

  it('ModuleBuildError', () => {
    const error = new ModuleBuildError(
      new InternalDTSError(new Error('helle world'), {
        buildType: 'bundle',
      }),
    );
    expect(error.toString().includes('DTS failed')).toBeTruthy();
  });
});
