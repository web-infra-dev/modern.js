export default function Page() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 32 }}>
      <h1>Modern.js MCP App</h1>
      <p>
        Open <a href="/mcp/inspector">MCP Apps Inspector</a> during development.
      </p>
      <ul>
        <li>
          <code>add_numbers</code>: call with{' '}
          <code>{'{ "a": 2, "b": 3 }'}</code> to get a result without a card.
        </li>
        <li>
          <code>greet</code>: call with <code>{'{ "name": "Ada" }'}</code> to
          open a card. Edit the name and submit to call the tool again.
        </li>
      </ul>
      <p>
        Endpoint: <code>/mcp</code>
      </p>
      <p>
        Edit <code>mcp_apps.ts</code> for tools and{' '}
        <code>src/components/Greeting.tsx</code> for the interactive card.
      </p>
    </main>
  );
}
