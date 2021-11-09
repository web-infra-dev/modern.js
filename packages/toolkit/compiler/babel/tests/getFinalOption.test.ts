import * as path from 'path';
import { DEFAULT_EXTENSIONS } from '@babel/core';
import {
  getFinalCompilerOption,
  getFilesFromDir,
  getFinalExtensions,
  getGlobPattern,
} from '../src/getFinalOption';
import { defaultDistFileExtMap } from '../src/constants';

const projectDir = path.join(__dirname, './fixtures/getFinalOption');
const sourceDir = path.join(projectDir, 'sourceDir');
const watchDir = path.join(projectDir, 'watchDir');

describe('get final compilerOption', () => {
  it('getGlobPattern', () => {
    const pattern_1 = getGlobPattern(sourceDir, ['.js']);
    expect(pattern_1).toBe(`${sourceDir}/**/*.js`);
    const pattern_2 = getGlobPattern(watchDir, ['.js', '.jsx']);
    expect(pattern_2).toBe(`${watchDir}/**/*{.js,.jsx}`);
    const pattern_3 = getGlobPattern(watchDir, []);
    expect(pattern_3).toBe(`${watchDir}/**/*`);
  });

  it('getFinalExtensions', () => {
    const finalexts_1 = getFinalExtensions(['.ts', '.tsx']);
    expect(finalexts_1).toStrictEqual(['.ts', '.tsx', ...DEFAULT_EXTENSIONS]);
    const finalexts_2 = getFinalExtensions(defaultExts => [
      '.ts',
      '.tsx',
      ...defaultExts,
    ]);
    expect(finalexts_2).toStrictEqual(['.ts', '.tsx', ...DEFAULT_EXTENSIONS]);
    const finalexts_3 = getFinalExtensions(() => ['.ts', '.tsx']);
    expect(finalexts_3).toStrictEqual(['.ts', '.tsx']);
    const finalexts_4 = getFinalExtensions(undefined);
    expect(finalexts_4).toStrictEqual(DEFAULT_EXTENSIONS);
  });

  it('getFilesFromDir', () => {
    const files_1 = getFilesFromDir({ dir: watchDir, finalExt: ['.js'] });
    expect(files_1.length).toBe(1);
    const files_2 = getFilesFromDir({
      dir: watchDir,
      finalExt: ['.js', '.jsx'],
    });
    expect(files_2.length).toBe(2);
    const files_3 = getFilesFromDir({
      dir: watchDir,
      finalExt: ['.js', '.jsx'],
      ignore: ['**/far.js'],
    });
    expect(files_3.length).toBe(1);
    const files_4 = getFilesFromDir({ dir: watchDir });
    expect(files_4.length).toBe(2);
  });

  it('getFinalCompilerOption', () => {
    const baseOption = {
      rootDir: projectDir,
      distDir: path.join(projectDir, 'dist'),
    };
    const baseFinalOption = {
      ...baseOption,
      enableWatch: false,
      enableVirtualDist: false,
      extensions: [],
      distFileExtMap: defaultDistFileExtMap,
      ignore: [],
      quiet: false,
      verbose: false,
      clean: false,
    };
    const option_1 = getFinalCompilerOption({ ...baseOption });
    expect(option_1).toStrictEqual({
      ...baseFinalOption,
      filenames: [],
    });
    const option_2 = getFinalCompilerOption({ ...baseOption, sourceDir });
    expect(option_2.filenames.length).toBe(1);
    expect(path.normalize(option_2.filenames[0])).toBe(
      path.normalize(path.join(sourceDir, './bar.js')),
    );
    const option_3 = getFinalCompilerOption({ ...baseOption, watchDir });
    expect(option_3.filenames.length).toBe(0);
    const option_4 = getFinalCompilerOption({
      ...baseOption,
      enableWatch: true,
      watchDir,
    });
    expect(option_4.filenames.length).toBe(2);
    expect(
      option_4.filenames.every(filename =>
        [
          path.normalize(path.join(watchDir, './far.js')),
          path.normalize(path.join(watchDir, './foo.jsx')),
        ].includes(path.normalize(filename)),
      ),
    ).toBe(true);

    const option_5 = getFinalCompilerOption({
      ...baseOption,
      filenames: ['./c.js'],
      sourceDir,
    });
    expect(option_5.filenames.length).toBe(2);
  });
});
