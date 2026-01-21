import pkg from '@modern-js/bff-core';

const { Api, Put } = pkg;

const getOrigin = ({ query: { id } }) => ({ id });

export default getOrigin;

export const DELETE = ({ data: { id } }) => ({ id });

export const handler = () => 'Hello Jupiter';

export const putRepo = Api(Put('/put-repo'), async () => {
  return 'Put repo';
});
