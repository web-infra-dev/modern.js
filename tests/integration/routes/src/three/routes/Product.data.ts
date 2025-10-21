import type { LoaderFunctionArgs } from '@modern-js/runtime/router';

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { id } = params;

  if (id === 'error') {
    throw new Error('Product load error');
  }

  return {
    productName: `Product ${id}`,
    productId: id,
  };
};
