import { program, Command } from '../src/utils/commander';

describe('utils', () => {
  it('default', () => {
    expect(program).toBeDefined();
    expect(Command).toBeDefined();
  });
});
