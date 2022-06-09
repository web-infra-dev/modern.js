import { Api, Put } from '../../../../../src';

const getOrigin = ({ query: { id } }: { query: { id: string } }) => ({ id });

export default getOrigin;

export const DELETE = ({ data: { id } }: { data: { id: string } }) => ({ id });

export const handler = () => 'Hello Jupiter';

export const putRepo = Api(Put('/put-repo'), async () => {
  return 'Put repo';
});
