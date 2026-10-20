export default function Page() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 32 }}>
      <h1>Modern.js MCP App</h1>
      <p>
        Call list_tasks in your MCP Apps host to open the server-backed task
        board.
      </p>
      <p>
        Endpoint: <code>/mcp</code>
      </p>
      <p>
        Edit <code>mcp_apps.ts</code> to define tools and{' '}
        <code>src/features/tasks/TaskBoard.tsx</code> to update the card.
      </p>
    </main>
  );
}
