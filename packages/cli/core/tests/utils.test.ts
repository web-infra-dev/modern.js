import { program } from '../src/utils/commander';

describe('utils', () => {
  it('default', () => {
    expect(program).toBeDefined();
  });
});
