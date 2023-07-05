declare module 'virtual-routes' {
  export { Route } from 'node/route/RouteService';

  export const routes: Route[];
}

declare module 'virtual-routes-ssr' {
  export { Route } from 'node/route/RouteService';

  export const routes: Route[];
}

declare module 'virtual-site-data' {
  import { SiteData } from 'shared/types';
  import ThemeConfig from 'shared/types/defaultTheme';

  const data: SiteData<ThemeConfig>;
  export default data;
}

declare module 'virtual-search-index-hash' {
  const hash: string;
  export default hash;
}

declare module 'virtual-global-components' {
  import { ComponentType } from 'react';

  const components: ComponentType[];
  export default components;
}

declare module 'virtual-global-styles';

declare module 'virtual-i18n-text';

declare module 'virtual-search-hooks' {
  export const onSearch: (query: string) => void | Promise<void>;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.svg' {
  const content: any;
  export default content;
}
