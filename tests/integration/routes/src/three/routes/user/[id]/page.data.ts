import { LoaderFunction } from '@modern-js/runtime/router';

export const loader: LoaderFunction = ({ params }) => {
  return {
    id: params.id,
  };
};
