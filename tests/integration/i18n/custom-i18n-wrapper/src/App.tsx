import { useModernI18n } from '@modern-js/plugin-i18n/runtime';

export default function App() {
  const { language, changeLanguage, i18nInstance } = useModernI18n();

  return (
    <div>
      <h1 id="translated-text">{i18nInstance?.t('key')}</h1>
      <p id="current-lang">Current Language: {language}</p>
      <button id="switch-en" onClick={() => changeLanguage('en')}>
        Switch to EN
      </button>
      <button id="switch-zh" onClick={() => changeLanguage('zh-Hant-TW')}>
        切換到繁體中文
      </button>
    </div>
  );
}
