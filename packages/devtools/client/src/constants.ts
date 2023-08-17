import { InternalTab } from './types';

export const getDefaultTabs = (): InternalTab[] => [
  {
    name: 'overview',
    title: 'Overview',
    view: { type: 'builtin', url: '/overview' },
  },
  {
    name: 'pages',
    title: 'Pages',
    view: { type: 'builtin', url: '/page' },
  },
];
