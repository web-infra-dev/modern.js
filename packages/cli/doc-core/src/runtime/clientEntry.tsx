import Theme from '@theme';
import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { App, initPageData } from './App';
import { DataContext, ThemeContext } from './hooks';
import { normalizeRoutePath } from './utils';
import { isProduction } from '@/shared/utils/index';

export async function renderInBrowser() {
  const container = document.getElementById('root')!;
  const enhancedApp = async () => {
    const initialPageData = await initPageData(
      normalizeRoutePath(window.location.pathname),
    );
    return function RootApp() {
      const [data, setData] = useState(initialPageData);
      const [theme, setTheme] = useState<'light' | 'dark'>('light');
      return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
          <DataContext.Provider value={{ data, setData }}>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </DataContext.Provider>
        </ThemeContext.Provider>
      );
    };
  };
  const RootApp = await enhancedApp();
  if (process.env.__IS_REACT_18__) {
    const { createRoot, hydrateRoot } = require('react-dom/client');
    if (isProduction()) {
      hydrateRoot(container, <RootApp />);
    } else {
      createRoot(container).render(<RootApp />);
    }
  } else {
    const ReactDOM = require('react-dom');
    if (isProduction()) {
      ReactDOM.hydrate(<RootApp />, container);
    } else {
      ReactDOM.render(<RootApp />, container);
    }
  }
}

renderInBrowser().then(() => {
  Theme.setup();
});
