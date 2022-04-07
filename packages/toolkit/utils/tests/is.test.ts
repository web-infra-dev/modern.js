import { isEmpty, isFastRefresh } from '../src/is';

describe('validate', () => {
  it('should validate empty object correctly', () => {
    expect(isEmpty({})).toBeTruthy();
    expect(isEmpty({ foo: 'bar' })).toBeFalsy();
  });

  it('should validate fast refresh correctly', () => {
    const { NODE_ENV, FAST_REFRESH } = process.env;

    process.env.NODE_ENV = 'development';
    process.env.FAST_REFRESH = 'true';
    expect(isFastRefresh()).toBeTruthy();

    process.env.NODE_ENV = 'production';
    process.env.FAST_REFRESH = 'true';
    expect(isFastRefresh()).toBeFalsy();

    process.env.NODE_ENV = 'development';
    process.env.FAST_REFRESH = 'false';
    expect(isFastRefresh()).toBeFalsy();

    process.env.NODE_ENV = NODE_ENV;
    process.env.FAST_REFRESH = FAST_REFRESH;
  });
});
