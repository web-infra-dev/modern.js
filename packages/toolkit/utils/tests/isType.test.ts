import { isString, isUndefined } from '../src/is/type';

describe('validate type', () => {
  it('should validate string correctly', () => {
    expect(isString('')).toBeTruthy();
    expect(isString('foo')).toBeTruthy();
    expect(isString(null)).toBeTruthy();
    expect(isString(123)).toBeFalsy();
  });

  it('should validate undeinfed correctly', () => {
    expect(isUndefined(undefined)).toBeTruthy();
    expect(isUndefined(null)).toBeTruthy();
    expect(isUndefined('')).toBeFalsy();
    expect(isUndefined(123)).toBeFalsy();
  });
});
