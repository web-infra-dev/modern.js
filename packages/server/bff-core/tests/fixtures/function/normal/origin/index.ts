import { Api, Put } from '../../../../../src';

export const get = ({ query: { id } }: { query: { id: string } }) => ({ id });

export const DELETE = ({ data: { id } }: { data: { id: string } }) => ({ id });

export const handler = () => 'Hello Jupiter';

export const putRepo = Api(Put('/put-repo'), async () => {
  return 'Put repo';
});
