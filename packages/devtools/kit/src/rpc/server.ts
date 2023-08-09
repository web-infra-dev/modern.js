import { ServerRoute } from '@modern-js/types';

export interface ServerFunctions {
  getServerRoutes: () => ServerRoute[];
  echo: (content: string) => string;
}
