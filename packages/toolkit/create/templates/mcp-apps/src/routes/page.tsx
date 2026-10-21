export default function Page() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 32, maxWidth: 720 }}>
      <h1>Modern.js MCP Todo</h1>
      <p>
        Open <a href="/mcp/inspector">MCP Apps Inspector</a> during development.
      </p>
      <ol>
        <li>
          Call <code>add_todo</code> with{' '}
          <code>{'{ "title": "Learn MCP Apps" }'}</code>.
        </li>
        <li>
          Call <code>list_todos</code> with <code>{'{}'}</code> to open the Todo
          card.
        </li>
        <li>Edit a title, change its status or delete it in the card.</li>
        <li>
          Call <code>list_todos</code> again to verify the shared server state.
        </li>
      </ol>
      <p>
        Endpoint: <code>/mcp</code>. Only <code>list_todos</code> opens a card.
      </p>
      <p>
        Edit <code>mcp_apps.ts</code> for tools, <code>server/store.ts</code>{' '}
        for data, and <code>src/components/Todos.tsx</code> for the UI.
      </p>
      <p>
        Data is shared in server memory and resets when the server restarts.
      </p>
    </main>
  );
}
