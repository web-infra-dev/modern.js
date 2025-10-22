import originalI18next from 'i18next';

const i18next = originalI18next.createInstance();

i18next.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        key: 'Hello World',
        about: 'About',
      },
    },
    zh: {
      translation: {
        key: '你好，世界',
        about: '关于',
      },
    },
  },
});

export default i18next;
