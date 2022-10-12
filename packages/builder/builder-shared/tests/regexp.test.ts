import { expect, describe, it } from 'vitest';
import {
  JS_REGEX,
  TS_REGEX,
  mergeRegex,
  getRegExpForExts,
  FONT_EXTENSIONS,
} from '../src';

describe('mergeRegex', () => {
  it('should merge two regexp correctly', () => {
    expect(mergeRegex(TS_REGEX, JS_REGEX)).toEqual(
      /\.(ts|mts|cts|tsx)$|\.(js|mjs|cjs|jsx)$/,
    );
  });

  it('should merge regexp and string correctly', () => {
    expect(mergeRegex(TS_REGEX, 'foo')).toEqual(/\.(ts|mts|cts|tsx)$|foo/);
  });
});

describe('getRegExpForExts', () => {
  it('should get correct RegExp of exts', () => {
    expect(getRegExpForExts(FONT_EXTENSIONS)).toEqual(
      /\.(woff|woff2|eot|ttf|otf|ttc)$/i,
    );
  });
});
