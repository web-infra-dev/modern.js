import { isNodeJS } from '../src/is/platform';

describe('validate platform', () => {
  it('should validate Node.js correctly', () => {
    expect(isNodeJS()).toBeTruthy();
  });
});
