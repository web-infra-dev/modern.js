import {
  isArray,
  isObject,
  isString,
  isUndefined,
  isPlainObject,
} from '../src/is/type';

describe('validate type', () => {
  it('should validate string correctly', () => {
    expect(isString('')).toBeTruthy();
    expect(isString('foo')).toBeTruthy();
    expect(isString(null)).toBeFalsy();
    expect(isString(123)).toBeFalsy();
  });

  it('should validate undefined correctly', () => {
    expect(isUndefined(undefined)).toBeTruthy();
    expect(isUndefined(null)).toBeFalsy();
    expect(isUndefined('')).toBeFalsy();
    expect(isUndefined(123)).toBeFalsy();
  });

  it('should validate array correctly', () => {
    expect(isArray(undefined)).toBeFalsy();
    expect(isArray(null)).toBeFalsy();
    expect(isArray('')).toBeFalsy();
    expect(isArray(123)).toBeFalsy();
    expect(isArray({})).toBeFalsy();
    expect(isArray([])).toBeTruthy();
  });

  it('should validate object correctly', () => {
    expect(isObject(1)).toBeFalsy();
    expect(isObject('1')).toBeFalsy();
    expect(isObject(undefined)).toBeFalsy();
    expect(isObject(null)).toBeFalsy();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    expect(isObject(() => {})).toBeFalsy();
    expect(isObject({})).toBeTruthy();
    expect(isObject([])).toBeTruthy();
    expect(isObject(/foo/)).toBeTruthy();
  });

  it('should validate plain object correctly', () => {
    expect(isPlainObject(1)).toBeFalsy();
    expect(isPlainObject('1')).toBeFalsy();
    expect(isPlainObject(undefined)).toBeFalsy();
    expect(isPlainObject(null)).toBeFalsy();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    expect(isPlainObject(() => {})).toBeFalsy();
    expect(isPlainObject({})).toBeTruthy();
    expect(isPlainObject([])).toBeFalsy();
    expect(isPlainObject(/foo/)).toBeFalsy();
  });
});
