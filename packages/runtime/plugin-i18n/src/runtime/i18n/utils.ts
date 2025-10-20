import { type I18nInstance, isI18nInstance } from './instance';

export function assertI18nInstance(obj: any): asserts obj is I18nInstance {
  if (!isI18nInstance(obj)) {
    throw new Error('Object does not implement I18nInstance interface');
  }
}
