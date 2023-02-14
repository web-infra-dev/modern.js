declare module 'virtual-routes' {
  export { Route } from 'node/route/RouteService';

  export const routes: Route[];
}

declare module 'virtual-site-data' {
  import { SiteData } from 'shared/types';
  import ThemeConfig from 'shared/types/default-theme';

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

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.svg' {
  const content: any;
  export default content;
}

declare module 'remark-container' {
  import { Plugin } from 'unified';

  const container: Plugin;
  export default container;
}
