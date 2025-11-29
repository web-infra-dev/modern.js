import i18next from 'i18next';

const instance = i18next.createInstance();

instance.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        key: 'Hello World from HTTP',
        about: 'About page from HTTP',
      },
    },
    zh: {
      translation: {
        key: '你好，世界（HTTP）',
        about: '关于（HTTP）',
      },
    },
  },
});

export default instance;
