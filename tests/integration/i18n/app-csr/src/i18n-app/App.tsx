import { useModernI18n } from '@modern-js/plugin-i18n/runtime';
import { BrowserRouter, Route, Routes } from '@modern-js/runtime/router';
import i18next from 'i18next';

const App = () => {
  const { changeLanguage } = useModernI18n();

  return (
    <BrowserRouter>
      <div>
        <button id="zh-button" onClick={() => changeLanguage('zh')}>
          zh
        </button>
        <button id="en-button" onClick={() => changeLanguage('en')}>
          en
        </button>
      </div>
      <Routes>
        <Route index element={<div id="key">{i18next.t('key')}</div>} />
        <Route
          path="about"
          element={<div id="about">{i18next.t('about')}</div>}
        />
        <Route path="*">404</Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
