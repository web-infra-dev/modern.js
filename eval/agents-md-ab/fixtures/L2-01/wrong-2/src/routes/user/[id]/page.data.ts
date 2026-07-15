import type { LoaderFunctionArgs } from '@modern-js/runtime/router';

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id as string;
  return { id, name: `user-${id}` };
};
