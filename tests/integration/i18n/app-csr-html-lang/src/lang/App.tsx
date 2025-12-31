import { I18nLink, useModernI18n } from '@modern-js/plugin-i18n/runtime';
import {
  BrowserRouter,
  Outlet,
  Route,
  Routes,
} from '@modern-js/runtime/router';
import i18next from 'i18next';

const App = () => {
  const { language, changeLanguage, supportedLanguages, isLanguageSupported } =
    useModernI18n();

  const handleLanguageChange = (newLang: string) => {
    if (isLanguageSupported(newLang)) {
      changeLanguage(newLang);
    }
  };

  return (
    <BrowserRouter basename="/lang">
      <div>
        <p>Current language: {language}</p>
        <p>Supported languages: {supportedLanguages.join(', ')}</p>
        {supportedLanguages.map(lang => (
          <button
            key={lang}
            onClick={() => handleLanguageChange(lang)}
            disabled={lang === language}
            style={{
              margin: '0 5px',
              backgroundColor: lang === language ? '#007bff' : '#f8f9fa',
              color: lang === language ? 'white' : 'black',
              border: '1px solid #dee2e6',
              padding: '5px 10px',
              borderRadius: '4px',
              cursor: lang === language ? 'default' : 'pointer',
            }}
          >
            {lang}
          </button>
        ))}
      </div>
      <Routes>
        <Route path=":lang" element={<Outlet />}>
          <Route
            index
            element={
              <div>
                <I18nLink to="/about">About</I18nLink>
                <div id="key">{i18next.t('key')}</div>
              </div>
            }
          />
          <Route
            path="about"
            element={
              <div>
                <I18nLink to="/">Index</I18nLink>
                <div id="about">{i18next.t('about')}</div>
              </div>
            }
          />
          <Route path="*">404</Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
