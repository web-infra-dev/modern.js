import { MWAActionFunctions } from '../src/newAction/mwa';

describe('new action test', () => {
  it('mwa', () => {
    expect(MWAActionFunctions.length).toBe(5);
  });
});
