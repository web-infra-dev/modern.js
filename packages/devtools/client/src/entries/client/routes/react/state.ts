import { $$globals } from '@/entries/client/globals';
import { WallAgent } from '@/utils/react-devtools';

export const wallAgent = new WallAgent();

$$globals.then(({ mountPoint }) => {
  wallAgent.bindRemote(mountPoint.remote, 'sendReactDevtoolsData');
});
