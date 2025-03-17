import { getMonitors } from '@modern-js/runtime';
import type { LoaderFunctionArgs } from '@modern-js/runtime/router';

export const loader = ({ context, request }: LoaderFunctionArgs) => {
  const monitors = getMonitors();

  monitors.error('debug in data loader request', request.url);

  return {
    exist: Boolean(monitors),
  };
};
