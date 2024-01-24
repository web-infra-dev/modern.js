import { createBridge, createStore } from 'react-devtools-inline/frontend';
import { $mountPoint } from '../state';
import { WallAgent } from '@/utils/react-devtools';

export const wallAgent = new WallAgent();

$mountPoint.then(mountPoint => {
  wallAgent.bindRemote(mountPoint.remote, 'sendReactDevtoolsData');
});

export const bridge = createBridge(window.parent, wallAgent);

export const store = createStore(bridge);
