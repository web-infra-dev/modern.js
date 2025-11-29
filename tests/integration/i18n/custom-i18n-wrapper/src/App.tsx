import { useModernI18n } from '@modern-js/plugin-i18n/runtime';
import { useEffect, useState } from 'react';

export default function App() {
  const { language, changeLanguage, i18nInstance } = useModernI18n();
  const [text, setText] = useState('');

  const updateText = () => {
    if (i18nInstance) {
      setText((i18nInstance as any).t('key'));
    }
  };

  useEffect(() => {
    updateText();

    const loadedHandler = () => {
      updateText();
    };
    const languageChangedHandler = () => {
      updateText();
    };

    if (i18nInstance) {
      i18nInstance.on?.('loaded', loadedHandler);
      i18nInstance.on?.('languageChanged', languageChangedHandler);
    }

    return () => {
      if (i18nInstance) {
        i18nInstance.off?.('loaded', loadedHandler);
        i18nInstance.off?.('languageChanged', languageChangedHandler);
      }
    };
  }, [i18nInstance]);

  useEffect(() => {
    updateText();
  }, [language, i18nInstance]);

  return (
    <div>
      <h1 id="sdk-text">{text}</h1>
      <p id="current-lang">Current Language: {language}</p>
      <button id="switch-en" onClick={() => changeLanguage('en')}>
        Switch to EN
      </button>
      <button id="switch-zh" onClick={() => changeLanguage('zh')}>
        切换到中文
      </button>
    </div>
  );
}
