import { defineMcpServer } from '@modern-js/mcp-apps/config';
import { name, version } from '../package.json';
import { addNumbers, greet } from './mcp-tools';

export default defineMcpServer({
  name,
  version,
  tools: [greet, addNumbers],
});
