import { useModernI18n } from '@modern-js/plugin-i18n/runtime';
import { useEffect, useState } from 'react';
import I18n from '../i18n';

export default function App() {
  const { language, changeLanguage, i18nInstance } = useModernI18n();
  const [text, setText] = useState('');

  useEffect(() => {
    const updateText = () => {
      if (i18nInstance) {
        setText(i18nInstance.t('key'));
      }
    };
    updateText();
    i18nInstance?.on?.('loaded', updateText);
    i18nInstance?.on?.('languageChanged', updateText);

    return () => {
      i18nInstance?.off?.('loaded', updateText);
      i18nInstance?.off?.('languageChanged', updateText);
    };
  }, [i18nInstance, language]);

  return (
    <div>
      <h1 id="sdk-text">{text}</h1>
      <p id="direct-text">{I18n.t('key')}</p>
      <p id="current-lang">Current Language: {language}</p>
      <button id="switch-en" onClick={() => changeLanguage('en')}>
        Switch to EN
      </button>
      <button id="switch-zh" onClick={() => changeLanguage('zh')}>
        切换到中文
      </button>
      <button
        id="switch-zh-hant-tw"
        onClick={() => changeLanguage('zh-Hant-TW')}
      >
        切換到繁體中文
      </button>
    </div>
  );
}
