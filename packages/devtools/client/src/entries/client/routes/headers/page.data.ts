import { redirect } from '@modern-js/runtime/router';
import { $$globals } from '../../globals';

export const loader = async () => {
  const { mountPoint } = await $$globals;
  const status = await mountPoint.remote
    .getServiceWorkerStatus()
    .catch(() => null);
  return redirect(status ? './editor' : './welcome');
};
