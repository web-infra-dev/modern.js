import { match } from '@modern-js/bff-runtime';
import { useContext } from '../../../../../../src/context';

export const get = ({ query }: { query: Record<string, unknown> }) => {
  return { query };
};

export const post = ({ data }: { data: Record<string, unknown> }) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const ctx = useContext();
  const { cookies } = ctx;
  return {
    query: ctx.query,
    data,
    cookies: {
      id: cookies.get('id', { signed: false }),
      name: cookies.get('name', { signed: false }),
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
