import { bff } from './bff';
import { dev } from './dev';
import { Schema } from './Schema';
import { server } from './server';
import { source } from './source';

const output = {
  ssg: { typeof: ['boolean', 'object', 'function'] },
};
const tools = {
  devServer: { type: 'object' },
};

const schema = new Schema();

schema
  .setSchema('bff', bff)
  .setSchema('dev', dev)
  .setSchema('server', server)
  .setSchema('source', source)
  .setSchema('output', output)
  .setSchema('tools', tools);

export default schema;
