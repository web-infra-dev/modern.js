import Backend from 'i18next-fs-backend';
import type { I18nInstance } from '../instance';

export const useI18nextBackend = (i18nInstance: I18nInstance) => {
  return i18nInstance.use(Backend);
};
