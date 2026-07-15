import { defineRoutes } from '@modern-js/runtime/config-routes';

export default defineRoutes(({ route }, fileRoutes) => {
  return [...fileRoutes, route('home.tsx', '/home')];
});
