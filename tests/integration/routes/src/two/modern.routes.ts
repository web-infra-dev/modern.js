import { defineRoutes } from '@modern-js/runtime/config-routes';

export default defineRoutes(({ layout, page, route, $ }) => {
  return [
    layout('routes/MainLayout.tsx', [
      page('routes/Home.tsx'),
      route('', 'user', [route('./routes/User.tsx', ':id')]),
      page('routes/Boom.tsx', 'boom'),
      $('routes/CatchAll.tsx', '*'),
    ]),
  ];
});
