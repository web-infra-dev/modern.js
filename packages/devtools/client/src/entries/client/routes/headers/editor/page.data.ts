import { $$globals } from '@/entries/client/globals';

export const loader = async () => {
  try {
    const { mountPoint } = await $$globals;
    const status = await mountPoint.remote
      .getServiceWorkerStatus()
      .catch(() => null);
    return status;
  } catch {
    return null;
  }
};

export type LoaderData = Awaited<ReturnType<typeof loader>>;
