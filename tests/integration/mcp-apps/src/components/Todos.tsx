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
  return (
    <section>
      <h1>Todos</h1>
      <ul>
        {items.map(todo => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
      <form
        onSubmit={event => {
          event.preventDefault();
          void add().catch(() => setError('Could not add todo'));
        }}
      >
        <input
          aria-label="Todo title"
          value={title}
          onChange={event => setTitle(event.target.value)}
        />
        <button type="submit">Add todo</button>
      </form>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
