import { match } from '@modern-js/bff-runtime';
import { useContext } from '../../../../../src/context';

export const get = ({ query }: { query: Record<string, unknown> }) => ({
  query,
});

export const post = ({ data }: { data: Record<string, unknown> }) => {
  const ctx = useContext();
  const { cookies } = ctx;
  return {
    query: ctx.query,
    data,
    cookies: {
      id: cookies.get('id'),
      name: cookies.get('name'),
    },
  };
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
