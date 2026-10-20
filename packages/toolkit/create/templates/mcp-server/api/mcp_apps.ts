import { defineMcpServer } from '@modern-js/mcp-apps/config';
import { name, version } from '../package.json';
import { greet, addNumbers } from '../mcp_tools';

export default defineMcpServer({
  name,
  version,
  tools: [greet, addNumbers],
});
