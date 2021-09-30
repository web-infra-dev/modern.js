import { match } from '@modern-js/runtime/server';

export const get = ({ query }: { query: Record<string, unknown> }) => ({
  query,
});
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
