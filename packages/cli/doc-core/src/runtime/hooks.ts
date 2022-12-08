import { createContext, useContext } from 'react';
import { UserConfig } from 'shared/types';

interface IDataContext {
  data: UserConfig;
}

export const DataContext = createContext({} as IDataContext);

export function usePageData() {
  const ctx = useContext(DataContext);
  return ctx.data;
}
