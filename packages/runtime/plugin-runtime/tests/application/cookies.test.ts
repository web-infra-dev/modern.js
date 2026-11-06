import { parseBrowserCookies } from '../../src/core/browser/data';

it.each([
  ['', {}],
  ['lang=en; lang=zh', { lang: 'en' }],
  [
    'a="foo"; b="foo; c="; d=%22foo%22',
    { a: 'foo', b: '"foo', c: '', d: '"foo"' },
  ],
  [
    'a=%ZZ; b=%E0%A4%A; c=foo+bar; d=%E4%B8%AD',
    { a: '%ZZ', b: '%E0%A4%A', c: 'foo+bar', d: '中' },
  ],
  [
    '\t a \t=\t b \t; ignored; empty=; =value; eq=a=b',
    { a: 'b', empty: '', '': 'value', eq: 'a=b' },
  ],
  ['a=\u00a0b\u00a0', { a: '\u00a0b\u00a0' }],
  [
    '__proto__=x; constructor=y; toString=z; hasOwnProperty=w',
    { constructor: 'y', toString: 'z', hasOwnProperty: 'w' },
  ],
])('preserves browser cookie parsing for %s', (input, expected) => {
  const value = parseBrowserCookies(input as string);
  expect(value).toEqual(expected);
  expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
  expect(Object.prototype.hasOwnProperty.call(value, '__proto__')).toBe(false);
});
