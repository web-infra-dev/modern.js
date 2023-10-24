import { DummyClass } from '../src';

describe('basic test', () => {
  test('should compile legacy decorator correctly', () => {
    expect(new DummyClass()).toEqual({});
  });
});
