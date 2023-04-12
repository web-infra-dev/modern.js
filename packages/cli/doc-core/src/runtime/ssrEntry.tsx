import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { PageData } from 'shared/types';
import { App, initPageData } from './App';
import { DataContext, ThemeContext } from './hooks';

const DEFAULT_THEME = 'light';

export async function render(
  pagePath: string,
  helmetContext: object,
): Promise<{ appHtml: string; pageData: PageData }> {
  const initialPageData = await initPageData(pagePath);

  const appHtml = renderToString(
    <ThemeContext.Provider value={{ theme: DEFAULT_THEME }}>
      <DataContext.Provider value={{ data: initialPageData }}>
        <StaticRouter location={pagePath}>
          <App helmetContext={helmetContext} />
        </StaticRouter>
      </DataContext.Provider>
    </ThemeContext.Provider>,
  );

  return {
    appHtml,
    pageData: initialPageData,
  };
}

export { routes } from 'virtual-routes-ssr';
