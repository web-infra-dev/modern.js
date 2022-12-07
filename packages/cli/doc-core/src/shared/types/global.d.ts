declare module 'virtual-routes' {
  interface Route {
    path: string;
    element: React.ReactElement;
    filePath: string;
    preload: () => Promise<void>;
  }
  export const routes: Route[];
}

declare module 'virtual-site-data' {
  import { UserConfig } from 'shared/types';

  const data: UserConfig;
  export default data;
}
