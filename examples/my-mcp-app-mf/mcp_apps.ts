import { defineMcpServer } from '@modern-js/mcp-apps/config';
import { name, version } from './package.json';
import { createTask, listTasks, updateTask } from './src/features/tasks/server/tools';



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
    {
      name: 'greet',
      description: 'Greet someone.',
      inputSchema: {
        type: 'object',
        properties: { name: { type: 'string', minLength: 1 } },
        required: ['name'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      handler: async ({ name }) => {
        const message = `Hello, ${name}!`;
        return {
          content: [{ type: 'text', text: message }],
          structuredContent: { message },
          viewProps: { message },
        };
      },
      visibility: ['model', 'app'],
      remote: 'mcp_ui',
      view: { module: './Greeting' },
    },
    {
      name: 'add_numbers',
      description: 'Add two numbers.',
      inputSchema: {
        type: 'object',
        properties: { a: { type: 'number' }, b: { type: 'number' } },
        required: ['a', 'b'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      handler: ({ a, b }) => {
        const sum = a + b;
        return {
          content: [{ type: 'text', text: `${a} + ${b} = ${sum}` }],
          structuredContent: { a, b, sum },
          viewProps: { a, b, sum },
        };
      },
      visibility: ['model', 'app'],
      remote: 'mcp_ui',
      view: { module: './Sum' },
    },
  ],
});
