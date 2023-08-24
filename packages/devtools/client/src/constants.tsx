import {
  HomeIcon,
  MixerHorizontalIcon,
  FileTextIcon,
} from '@radix-ui/react-icons';
import { InternalTab } from './types';

export const getDefaultTabs = (): InternalTab[] => [
  {
    name: 'overview',
    title: 'Overview',
    icon: <HomeIcon />,
    view: { type: 'builtin', url: '/overview' },
  },
  {
    name: 'config',
    title: 'Config',
    icon: <MixerHorizontalIcon />,
    view: { type: 'builtin', url: '/config' },
  },
  {
    name: 'pages',
    title: 'Pages',
    icon: <FileTextIcon />,
    view: { type: 'builtin', url: '/pages' },
  },
];
