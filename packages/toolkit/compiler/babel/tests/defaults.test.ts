import { mergeDefaultOption } from '../src/defaults';

describe('defaults', () => {
  it('should merge default option', () => {
    const option_1 = mergeDefaultOption({
      rootDir: './',
      distDir: './dist',
      filenames: ['far.js'],
    });
    expect(option_1).toStrictEqual({
      rootDir: './',
      distDir: './dist',
      filenames: ['far.js'],
      enableWatch: false,
      enableVirtualDist: false,
      extensions: [],
      distFileExtMap: {
        '.js': '.js',
        '.jsx': '.js',
        '.ts': '.js',
        '.tsx': '.js',
      },
      ignore: [],
      quiet: false,
      verbose: false,
      clean: false,
    });
  });
});
