/** Small development client for stateless JSON and finite SSE MCP responses. */
export class McpInspectorClient {
  private session: string | null = null;
  constructor(
    private url: URL,
    private fetcher: typeof fetch = fetch,
  ) {}
  async request(
    method: string,
    params?: Record<string, unknown>,
    notification = false,
  ) {
    const url = this.url;
    if (!['http:', 'https:'].includes(url.protocol))
      throw new Error('Use an HTTP or HTTPS MCP endpoint');
    const response = await this.fetcher.call(globalThis, url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        ...(this.session ? { 'Mcp-Session-Id': this.session } : {}),
        ...(method !== 'initialize'
          ? { 'MCP-Protocol-Version': '2025-11-25' }
          : {}),
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        ...(notification ? {} : { id: crypto.randomUUID() }),
        method,
        params,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    this.session = response.headers.get('Mcp-Session-Id') ?? this.session;
    const text = await response.text();
    if (notification && response.ok) return;
    if (!response.ok)
      throw new Error(`HTTP ${response.status}: ${text.slice(0, 300)}`);
    const payload = response.headers
      .get('content-type')
      ?.includes('text/event-stream')
      ? text
          .split(/\r?\n\r?\n/)
          .map(event =>
            event
              .split(/\r?\n/)
              .filter(line => line.startsWith('data:'))
              .map(line => line.slice(5).trimStart())
              .join('\n'),
          )
          .filter(Boolean)
          .map(data => JSON.parse(data))
          .find(item => 'result' in item || 'error' in item)
      : JSON.parse(text);
    if (!payload) throw new Error('No MCP result received');
    if (payload.error) throw new Error(payload.error.message);
    return payload.result;
  }
}
