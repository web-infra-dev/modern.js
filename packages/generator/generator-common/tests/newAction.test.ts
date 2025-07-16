import { i18n } from '../src/locale';
import { ActionFunction, ActionFunctionText } from '../src/newAction/common';
import { MWAActionFunctions } from '../src/newAction/mwa';

describe('new action test', () => {
  it('mwa', () => {
    expect(MWAActionFunctions.length).toBe(6);
  });
});
