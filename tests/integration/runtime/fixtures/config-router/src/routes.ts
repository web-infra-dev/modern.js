import { DefinedRoutes } from '@modern-js/runtime/router';

import { Banana } from './comps';

const Layout = '@/Layout';

const routes: DefinedRoutes = [
  {
    path: '/',
    component: Layout,
    title: 'home',
    children: [
      {
        path: 'apple',
        component: '@/pages/Apple',
        title: 'apple',
      },
      {
        path: 'banana/:id',
        component: Banana,
        title: 'banana',
      },
    ],
  },
  {
    path: 'toapple',
    redirect: '/apple',
    component: '@/pages/Cat',
  },
  {
    path: '*',
    component: '@/404',
    title: '404',
  },
];

export default routes;
