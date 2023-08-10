import { NormalizedConfig } from '@modern-js/core';
import type { AppTools } from '@modern-js/app-tools';
import { ServerRoute } from '@modern-js/types';

export interface ServerFunctions {
  getServerRoutes: () => Promise<ServerRoute[]>;
  getAppConfig: () => Promise<NormalizedConfig<AppTools>>;
  echo: (content: string) => string;
}
