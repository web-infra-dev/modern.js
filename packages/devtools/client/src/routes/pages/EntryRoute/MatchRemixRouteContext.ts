import { RouteMatch, RouteObject } from '@modern-js/runtime/router';
import { createContext } from 'react';

export const MatchRemixRouteContext = createContext<
  RouteMatch<string, RouteObject>[]
>([]);
