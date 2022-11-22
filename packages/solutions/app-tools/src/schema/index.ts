import { bff } from './bff';
import { dev } from './dev';
import { Schema } from './Schema';
import { server } from './server';
import { source } from './source';

const output = {
  ssg: { typeof: ['boolean', 'object', 'function'] },
  enableModernMode: { type: 'boolean' },
};
const tools = {
  devServer: { type: 'object' },
  tailwindcss: { type: 'object' },
  jest: { typeof: ['object', 'function'] },
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
