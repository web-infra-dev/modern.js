import { describe, expect, it } from 'vitest';
import { awaitableGetter, isCssModules } from '../src';

describe('awaitableGetter', () => {
  it('should work', async () => {
    const arr = ['123', '456'];
    const promises = arr.map(item => Promise.resolve(item));
    const wrapped = awaitableGetter(promises);
    expect(wrapped.promises).toStrictEqual(promises);
    expect(await wrapped).toStrictEqual(arr);
  });
});

it('check isCssModules', () => {
  expect(isCssModules('src/index.css', false)).toBeFalsy();
  expect(isCssModules('src/index.css', { auto: false })).toBeFalsy();
  expect(isCssModules('src/index.module.css', { auto: false })).toBeFalsy();

  expect(isCssModules('src/index.css', true)).toBeTruthy();

  expect(isCssModules('src/index.css', { auto: true })).toBeFalsy();
  expect(isCssModules('src/index.module.css', { auto: true })).toBeTruthy();

  expect(
    isCssModules('src/index.module.css', {
      auto: path => {
        return path.includes('.module.');
      },
    }),
  ).toBeTruthy();

  expect(
    isCssModules('src/index.css', {
      auto: path => {
        return path.includes('.module.');
      },
    }),
  ).toBeFalsy();
});
