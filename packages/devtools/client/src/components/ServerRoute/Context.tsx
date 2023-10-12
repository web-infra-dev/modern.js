import { ServerRoute } from '@modern-js/types';
import { createContext } from 'react';

export interface MatchServerRouteValue {
  url: string;
  matched?: ServerRoute;
}

export const MatchUrlContext = createContext<MatchServerRouteValue>({
  url: '',
});
