import { createSyncHook } from '@modern-js/plugin-v2';
import type { RouteProps } from 'react-router-dom';

// only for inhouse use
const modifyRoutesHook =
  createSyncHook<(routes: RouteProps[]) => RouteProps[]>();

export { modifyRoutesHook };
