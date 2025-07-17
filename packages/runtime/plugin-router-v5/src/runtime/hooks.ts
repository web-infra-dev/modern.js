import { createSyncHook } from '@modern-js/plugin';
import type { RouteProps } from 'react-router-dom';
import type { SingleRouteConfig } from './plugin';

// only for inhouse use
const modifyRoutesHook =
  createSyncHook<(routes: RouteProps[]) => SingleRouteConfig[]>();

export { modifyRoutesHook };
