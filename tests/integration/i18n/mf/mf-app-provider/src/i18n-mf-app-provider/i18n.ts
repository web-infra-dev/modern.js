import i18next from 'i18next';

if (!i18next.isInitialized) {
  i18next.init({
    fallbackLng: 'en',
    resources: {
      en: {
        translation: {
          key: 'Hello World(provider)',
          about: 'About(provider)',
        },
      },
      zh: {
        translation: {
          key: '你好，世界(provider)',
          about: '关于(provider)',
        },
      },
    },
  });
}

export default i18next;
