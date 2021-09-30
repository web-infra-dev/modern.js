import { String, match } from '@modern-js/bff-runtime';

export const get = match(
  {
    request: { query: { id: String } },
    response: { id: String },
  },
  ({ query: { id } }) => ({ id }),
);

export const post = match(
  {
    request: { data: { id: String } },
    response: { id: String },
  },
  ({ data: { id } }) => ({ id }),
);
