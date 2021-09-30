import {
  validate,
  validateWatchDir,
  validateSourceDirAndFileNames,
  sourceDirAndFileNamesValidMessage,
  watchDirValidMessage,
} from '../src/validate';

describe('valide', () => {
  const baseOption = { rootDir: './', distDir: './dist', quiet: true };

  it('valide sourceDir and filenams config', () => {
    const ret_1 = validateSourceDirAndFileNames({
      ...baseOption,
      sourceDir: './src',
    });
    expect(ret_1).toBe(null);
    const ret_2 = validateSourceDirAndFileNames({
      ...baseOption,
      filenames: ['./far.js'],
    });
    expect(ret_2).toBe(null);

    const ret_3 = validateSourceDirAndFileNames({
      ...baseOption,
      sourceDir: './src',
      filenames: ['./far.js'],
    });
    expect(ret_3).toBe(null);

    const ret_4 = validateSourceDirAndFileNames({ ...baseOption });
    expect(ret_4).toStrictEqual({
      code: 1,
      message: sourceDirAndFileNamesValidMessage,
      virtualDists: [],
    });
  });

  it('valid watchDir config', () => {
    const ret_1 = validateWatchDir({ ...baseOption, enableWatch: true });
    expect(ret_1).toStrictEqual({
      code: 1,
      message: watchDirValidMessage,
      virtualDists: [],
    });

    const ret_2 = validateWatchDir({
      ...baseOption,
      enableWatch: true,
      watchDir: './src',
    });
    expect(ret_2).toBe(null);
  });

  it('validate', () => {
    const ret_1 = validate({ ...baseOption, sourceDir: './src' });
    expect(ret_1).toBe(null);
    const ret_2 = validate({ ...baseOption, filenames: ['./far.js'] });
    expect(ret_2).toBe(null);
    const ret_3 = validate({
      ...baseOption,
      sourceDir: './src',
      enableWatch: true,
      watchDir: './src',
    });
    expect(ret_3).toBe(null);
  });
});
