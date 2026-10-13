export default function Page() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 32 }}>
      <h1>Modern.js MCP App</h1>
      <p>Your greeting app is ready to connect to an MCP Apps host.</p>
      <p>
        Endpoint: <code>/mcp</code>
      </p>
      <p>
        Edit <code>mcp_apps.ts</code> to define tools and{' '}
        <code>src/components/Greeting.tsx</code> to update the card.
      </p>
    </main>
  );
}
