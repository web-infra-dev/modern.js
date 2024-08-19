import type { LoaderFunctionArgs } from '@modern-js/runtime/router';
import type { Var } from '../../shared';

export const loader = async ({ context }: LoaderFunctionArgs<Var>) => {
  const user = context?.get('user');

  return {
    name: user?.name || 'unknown',
  };
};
