import { InternalTab } from './types';

export const getDefaultTabs = (): InternalTab[] => [
  {
    name: 'overview',
    title: 'Overview',
    view: { type: 'builtin', url: '/overview' },
  },
  {
    name: 'router',
    title: 'Router',
    view: { type: 'builtin', url: '/router' },
  },
];
