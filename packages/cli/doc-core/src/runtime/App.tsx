import siteData from 'virtual-site-data';
import { Layout } from '../theme-default/layout/Layout';
import { DataContext } from './hooks';

export function App() {
  return (
    <DataContext.Provider value={{ data: siteData }}>
      <Layout />
    </DataContext.Provider>
  );
}
