if (process.env.MCP_BUILD_ONLY)
  throw new Error('UI builds must not execute business code');
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
}
const todos: Todo[] = [];
export const listTodos = () => todos.map(todo => ({ ...todo }));
export function addTodo(title: string) {
  const todo = { id: crypto.randomUUID(), title, completed: false };
  todos.push(todo);
  return { ...todo };
}
