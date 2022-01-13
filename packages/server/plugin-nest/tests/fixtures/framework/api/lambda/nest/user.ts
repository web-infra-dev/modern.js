import { match } from '@modern-js/bff-runtime';
import { useContext } from '../../../../../../src/context';

export const get = ({ query }: { query: Record<string, unknown> }) => ({
  query,
});

export const post = ({ data }: { data: Record<string, unknown> }) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const ctx = useContext();
  const { request } = ctx;
  return {
    query: request.query,
    data,
  } as any;
};

export const patch = match(
  {
    request: {
      data: {
        id: Number,
        name: String,
      },
    },
    response: { id: Number },
  },
  ({ data: { id } }) => ({ id }),
);
