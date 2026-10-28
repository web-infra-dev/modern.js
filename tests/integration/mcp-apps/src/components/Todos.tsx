import type { McpCapabilities } from '@modern-js/mcp-apps/react';
import { useState } from 'react';
import type { McpViewProps } from '@modern-js/mcp-apps/react';
interface Todo {
  id: string;
  title: string;
  completed: boolean;
}
export default function Todos({
  todos = [],
  mcpApp,
}: McpViewProps<{ todos: Todo[] }>) {
  const [items, setItems] = useState(todos);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  async function add() {
    if (!title.trim()) return;
    const result = await mcpApp.callServerTool({
      name: 'add_todo',
      arguments: { title },
    });
    if (result.isError) {
      setError('Could not add todo');
      return;
    }
    const todo = (result.structuredContent as { todo?: Todo } | undefined)
      ?.todo;
    if (todo) setItems(previous => [...previous, todo]);
    setTitle('');
  }
  const submit = () => {
    void add().catch(() => setError('Could not add todo'));
  };
  return (
    <section>
      <h1>Todos</h1>
      <ul>
        {items.map(todo => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
      {/* MCP hosts sandbox cards without allow-forms, which blocks form submission. */}
      <div>
        <input
          aria-label="Todo title"
          value={title}
          onChange={event => setTitle(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') submit();
          }}
        />
        <button type="button" onClick={submit}>
          Add todo
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}

export const mcpCapabilities = {
  experimental: { fixture: { source: 'mf' } },
} satisfies McpCapabilities;
