import { joinPathWithPrefix } from '../../src/utils/input';

describe('utils: input', () => {
  it('joinPathWithPrefix', () => {
    const fn1 = joinPathWithPrefix('!');
    expect(fn1('/a', '!src')[0]).toBe('!');
  });
});
