import { expect, it } from 'vitest';
import { wrapQuotes } from '../../src/loaders/css-modules-typescript-loader';

it('should wrap key correctly', () => {
  // do not need wrap
  expect(wrapQuotes('foo')).toBe(`foo`);
  expect(wrapQuotes('f1o')).toBe(`f1o`);
  expect(wrapQuotes('Foo')).toBe(`Foo`);
  expect(wrapQuotes('$foo')).toBe(`$foo`);
  expect(wrapQuotes('_foo')).toBe(`_foo`);
  expect(wrapQuotes('foo1')).toBe(`foo1`);
  expect(wrapQuotes('fooBar')).toBe(`fooBar`);

  // need wrap
  expect(wrapQuotes('#foo')).toBe(`'#foo'`);
  expect(wrapQuotes('1foo')).toBe(`'1foo'`);
  expect(wrapQuotes('-bar')).toBe(`'-bar'`);
  expect(wrapQuotes('foo-bar')).toBe(`'foo-bar'`);
  expect(wrapQuotes('foo~bar')).toBe(`'foo~bar'`);
});
