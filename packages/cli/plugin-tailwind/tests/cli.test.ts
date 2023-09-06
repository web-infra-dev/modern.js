import { getRandomTwConfigFileName } from '../src/macro';

describe('getRandomTwConfigFileName', () => {
  it('should return a string', () => {
    expect(getRandomTwConfigFileName('./.modern-js/')).toBeDefined();
  });
});
