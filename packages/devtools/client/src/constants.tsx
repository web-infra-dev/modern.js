import {
  HiOutlineHome,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineRectangleGroup,
  HiOutlineCube,
} from 'react-icons/hi2';
import { InternalTab } from './types';

export const getDefaultTabs = (): InternalTab[] => [
  {
    name: 'overview',
    title: 'Overview',
    icon: <HiOutlineHome />,
    view: { type: 'builtin', url: '/overview' },
  },
  {
    name: 'config',
    title: 'Config',
    icon: <HiOutlineAdjustmentsHorizontal />,
    view: { type: 'builtin', url: '/config' },
  },
  {
    name: 'pages',
    title: 'Pages',
    icon: <HiOutlineRectangleGroup />,
    view: { type: 'builtin', url: '/pages' },
  },
  {
    name: 'context',
    title: 'Context',
    icon: <HiOutlineCube />,
    view: { type: 'builtin', url: '/context' },
  },
];
