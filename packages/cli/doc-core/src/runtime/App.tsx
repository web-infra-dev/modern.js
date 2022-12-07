import { BrowserRouter } from 'react-router-dom';
import siteData from 'virtual-site-data';
import { Layout } from '../theme-default/Layout/Layout';
import { DataContext } from './hooks';

export function App() {
  return (
    <DataContext.Provider value={{ data: siteData }}>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </DataContext.Provider>
  );
}
