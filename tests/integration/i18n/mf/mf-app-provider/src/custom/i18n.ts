import originalI18next from 'i18next';

const i18next = originalI18next.createInstance();

i18next.init({
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        key: 'Hello World(provider-custom)',
        about: 'About(provider-custom)',
      },
    },
    zh: {
      translation: {
        key: '你好，世界(provider-custom)',
        about: '关于(provider-custom)',
      },
    },
  },
});

export default i18next;
