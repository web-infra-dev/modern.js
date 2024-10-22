import { i18n } from '../src/locale';
import { ActionFunction, ActionFunctionText } from '../src/newAction/common';
import { MWAActionFunctions } from '../src/newAction/mwa';

describe('new action test', () => {
  it('common', () => {
    i18n.changeLanguage({ locale: 'zh' });
    expect(ActionFunctionText[ActionFunction.Proxy]()).toBe('启用「全局代理」');
  });
  it('mwa', () => {
    expect(MWAActionFunctions.length).toBe(8);
  });
});
