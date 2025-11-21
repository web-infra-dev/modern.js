import originalI18next from 'i18next';

const i18next = originalI18next.createInstance();

i18next.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        key: 'Hello World(consumer)',
        about: 'About(consumer)',
      },
    },
    zh: {
      translation: {
        key: '你好，世界(consumer)',
        about: '关于(consumer)',
      },
    },
  },
});

export default i18next;
