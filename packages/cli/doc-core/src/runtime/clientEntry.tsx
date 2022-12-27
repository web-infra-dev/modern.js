import Theme from '@theme';
import { useState } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App, initPageData } from './App';
import { DataContext } from './hooks';
import { isProduction } from '@/shared/utils/index';

export async function renderInBrowser() {
  const container = document.getElementById('root')!;
  const enhancedApp = async () => {
    const initialPageData = await initPageData(window.location.pathname);
    return function RootApp() {
      const [data, setData] = useState(initialPageData);
      return (
        <DataContext.Provider value={{ data, setData }}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </DataContext.Provider>
      );
    };
  };
  const RootApp = await enhancedApp();
  if (isProduction()) {
    hydrateRoot(container, <RootApp />);
  } else {
    createRoot(container).render(<RootApp />);
  }
}

renderInBrowser().then(() => {
  Theme.setup();
});
