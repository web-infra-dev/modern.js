import { defineRoutes } from '@modern-js/runtime/config-routes';

export default defineRoutes(({ route }) => {
  return [route('home.tsx', '/home')];
});
