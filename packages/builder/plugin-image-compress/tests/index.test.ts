import { it, expect, describe } from 'vitest';
import { normalizeFinalOptions } from '../src';

describe('normalizeFinalOptions', () => {
  it('should handle on empty array', () => {
    expect(normalizeFinalOptions([])).toMatchInlineSnapshot('[]');
  });

  it('should handle on array of codec', () => {
    expect(normalizeFinalOptions(['avif', 'mozjpeg'])).toMatchSnapshot();
  });

  it('should handle on composed options', () => {
    expect(
      normalizeFinalOptions({ use: ['avif', 'mozjpeg'] }),
    ).toMatchSnapshot();
  });

  it('should handle on empty codec options', () => {
    expect(normalizeFinalOptions({ use: 'mozjpeg' })).toMatchSnapshot();
  });

  it('should handle on partial codec options', () => {
    expect(
      normalizeFinalOptions({ use: 'mozjpeg', color_space: 1 }),
    ).toMatchSnapshot();
  });

  it('should handle on codec options with ext tester', () => {
    expect(
      normalizeFinalOptions({ use: 'mozjpeg', test: /\.jpeg$/ }),
    ).toMatchSnapshot();
  });
});
