import { defineMcpServer } from '@modern-js/mcp-apps/config';
import { name, version } from './package.json';
import { createTask, listTasks, updateTask } from './src/features/tasks/server/tools';
import { greet, addNumbers } from './mcp_tools';

export default defineMcpServer({
  name,
  version,
  remotes: [{
    name: 'mcp_ui',
    baseUrl: process.env.MCP_UI_MANIFEST_URL ?? 'http://localhost:8080/static/mf-manifest.json',
    csp: {
      resourceDomains: [process.env.MCP_UI_ORIGIN ?? 'http://localhost:8080'],
      connectDomains: [process.env.MCP_UI_ORIGIN ?? 'http://localhost:8080'],
    },
  }],
  tools: [
    { ...listTasks, remote: 'mcp_ui', view: { module: './TaskBoard' } },
    createTask,
    updateTask,
    { ...greet, remote: 'mcp_ui', view: { module: './Greeting' } },
    { ...addNumbers, remote: 'mcp_ui', view: { module: './Sum' } },
  ],
});
