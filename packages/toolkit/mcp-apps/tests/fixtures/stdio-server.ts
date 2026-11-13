import { McpServer } from '@modelcontextprotocol/server';
import { registerUiResources, type RegisterUiOptions } from '../../src/server';
export default async function createServer(options: RegisterUiOptions) {
  const server = new McpServer({ name: 'stdio-fixture', version: '1' });
  const ui = await registerUiResources(server, options);
  server.registerTool(
    'fixture',
    { description: 'Fixture resource' },
    async () => ({
      content: [{ type: 'text', text: ui.local }],
    }),
  );
  return server;
}
