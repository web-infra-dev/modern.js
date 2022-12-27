import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { PageData } from 'shared/types';
import { App, initPageData } from './App';
import { DataContext } from './hooks';

export async function render(
  pagePath: string,
): Promise<{ appHtml: string; pageData: PageData }> {
  const initialPageData = await initPageData(pagePath);

  const appHtml = renderToString(
    <DataContext.Provider value={{ data: initialPageData }}>
      <StaticRouter location={pagePath}>
        <App />
      </StaticRouter>
    </DataContext.Provider>,
  );

  return {
    appHtml,
    pageData: initialPageData,
  };
}

export { routes } from 'virtual-routes';
