import { createStore } from '../src';

describe('plugin-testing', () => {
  it('default', () => {
    expect(createStore).toBeDefined();
  });
});
