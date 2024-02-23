import { $mountPoint } from '../state';
import { WallAgent } from '@/utils/react-devtools';

export const wallAgent = new WallAgent();

$mountPoint.then(mountPoint => {
  wallAgent.bindRemote(mountPoint.remote, 'sendReactDevtoolsData');
});
