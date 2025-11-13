import type { BackendOptions } from '../instance';

export const DEFAULT_I18NEXT_BACKEND_OPTIONS = {
  loadPath: '/locales/{{lng}}/{{ns}}.json',
  addPath: '/locales/{{lng}}/{{ns}}.json',
};

export const convertBackendOptions = (options?: BackendOptions) => {
  return options;
};
