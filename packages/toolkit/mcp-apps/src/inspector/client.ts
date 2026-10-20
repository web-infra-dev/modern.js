import {
  Client,
  StreamableHTTPClientTransport,
} from '@modelcontextprotocol/client';

/** Use the official SDK for version negotiation, envelopes and cancellation. */
export class McpInspectorClient {
  private client: Client;
  constructor(
    private url: URL,
    private fetcher: typeof fetch = fetch,
  ) {
    this.client = new Client(
      { name: 'modern-mcp-inspector', version: '1' },
      {
        versionNegotiation: { mode: 'auto' },
        capabilities: {
          extensions: {
            'io.modelcontextprotocol/ui': {
              mimeTypes: ['text/html;profile=mcp-app'],
            },
          },
        },
      },
    );
  }
  async request(
    method: string,
    params?: Record<string, unknown>,
    notification = false,
    signal?: AbortSignal,
  ): Promise<any> {
    if (!['http:', 'https:'].includes(this.url.protocol))
      throw new Error('Use an HTTP or HTTPS MCP endpoint');
    if (method === 'initialize') {
      await this.client.connect(
        new StreamableHTTPClientTransport(this.url, { fetch: this.fetcher }),
      );
      return {
        serverInfo: this.client.getServerVersion(),
        capabilities: this.client.getServerCapabilities(),
      };
    }
    // connect() already sends the initialized notification for legacy servers.
    if (method === 'notifications/initialized') return;
    if (notification) {
      await this.client.notification({
        method: method as 'notifications/cancelled',
        params,
      });
      return;
    }
    return this.client.request(
      { method: method as 'tools/list', params },
      { signal, timeout: 30_000 },
    );
  }
  close() {
    return this.client.close();
  }
}
