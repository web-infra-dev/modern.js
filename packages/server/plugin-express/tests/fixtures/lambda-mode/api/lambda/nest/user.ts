import { match } from '@modern-js/bff-runtime';
import { useContext } from '../../../../../../src/context';

export const get = ({ query }: { query: Record<string, unknown> }) => ({
  query,
});

export const post = ({ data }: { data: Record<string, unknown> }) => {
  const { req } = useContext();
  const { cookies } = req;
  return {
    query: req.query,
    data,
    cookies,
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
