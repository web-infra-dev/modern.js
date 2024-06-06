import {
  HiOutlineAcademicCap,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineCube,
  HiOutlineHome,
  HiOutlineRectangleGroup,
  HiMiniCircleStack,
} from 'react-icons/hi2';
import { RiReactjsLine, RiShieldCrossLine } from 'react-icons/ri';
import { Tab } from '@modern-js/devtools-kit/runtime';
import { ref } from 'valtio';
import { $serverExported, $tabs } from './state';
import { PluginGlobals, setupPlugins } from '@/utils/pluggable';

let _executed = false;

export const loader = async () => {
  if (_executed) return null;
  _executed = true;
  const runtimePlugins = (await $serverExported).context.def.plugins;
  const globals = PluginGlobals.use();
  await setupPlugins(runtimePlugins);
  const tabs: Tab[] = [
    {
      name: 'overview',
      title: 'Overview',
      icon: <HiOutlineHome />,
      view: { type: 'builtin', src: '/overview' },
    },
    {
      name: 'config',
      title: 'Config',
      icon: <HiOutlineAdjustmentsHorizontal />,
      view: { type: 'builtin', src: '/config' },
    },
    {
      name: 'pages',
      title: 'Pages',
      icon: <HiOutlineRectangleGroup />,
      view: { type: 'builtin', src: '/pages' },
    },
    {
      name: 'react',
      title: 'React',
      icon: <RiReactjsLine />,
      view: { type: 'builtin', src: '/react' },
    },
    {
      name: 'context',
      title: 'Context',
      icon: <HiOutlineCube />,
      view: { type: 'builtin', src: '/context' },
    },
    {
      name: 'headers',
      title: 'Header Modifier',
      icon: <HiOutlineAcademicCap />,
      view: { type: 'builtin', src: '/headers' },
    },
    {
      name: 'doctor',
      title: 'Doctor',
      icon: <RiShieldCrossLine />,
      view: { type: 'builtin', src: '/doctor' },
    },
    {
      name: 'storage',
      title: 'Storage',
      icon: <HiMiniCircleStack />,
      view: { type: 'builtin', src: '/storage/preset' },
    },
  ];
  await globals.callHook('tab:list', tabs);
  for (const tab of tabs) {
    if (typeof tab.icon === 'object') {
      tab.icon = ref(tab.icon);
    }
    if (tab.view.type === 'external') {
      tab.view.component = ref(tab.view.component);
    }
  }
  $tabs.length = 0;
  $tabs.push(...tabs);
  return null;
};
