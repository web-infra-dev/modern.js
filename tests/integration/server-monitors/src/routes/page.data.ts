import { getMonitors } from '@modern-js/runtime';
import type { LoaderFunctionArgs } from '@modern-js/runtime/router';

export const loader = ({ context }: LoaderFunctionArgs) => {
  const monitors = getMonitors();
  monitors.error('error in monitors');

  return {
    exist: Boolean(1),
  };
};
