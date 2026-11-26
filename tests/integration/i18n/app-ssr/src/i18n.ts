import originalI18next from 'i18next';
import { createCustomI18nInstance } from '../../custom-i18n-wrapper/src/custom-i18n-instance';

// The custom wrapper exercises Modern.js request detection, not i18next's detector.
const i18next =
  process.env.I18N_REQUEST_DETECTION === 'true'
    ? createCustomI18nInstance()
    : originalI18next.createInstance();

export { i18next };
