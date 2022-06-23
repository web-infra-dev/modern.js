import { String, match } from '@modern-js/bff-runtime';

export const get = match(
  {
    request: { params: { id: String } },
    response: { id: String },
  },
  ({ params: { id } }) => ({ id }),
);

export const post = match(
  {
    request: {
      params: { id: String },
      data: {},
    },
    response: { id: String },
  },
  ({ params: { id }, data }) => ({
    id,
    data,
  }),
);
