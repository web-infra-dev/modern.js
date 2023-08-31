import { RouteMatch, RouteObject } from '@modern-js/runtime/router';
import { ServerRoute } from '@modern-js/types';
import { createContext } from 'react';

export const MatchUrlContext = createContext<{
  server: ServerRoute | null;
  client: RouteMatch<string, RouteObject>[] | null;
}>({ server: null, client: null });
