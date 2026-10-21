import { randomUUID } from 'node:crypto';

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

// One process shares this list between conversation tools and the React card.
const todos: Todo[] = [
  { id: 'welcome', title: '学习 MCP Apps', completed: false },
];

export function listTodos() {
  return todos.map(todo => ({ ...todo }));
}

export function addTodo(title: string) {
  const trimmed = title.trim();
  if (!trimmed) throw new Error('Todo title cannot be empty');
  const todo = { id: randomUUID(), title: trimmed, completed: false };
  todos.push(todo);
  return { ...todo };
}

export function updateTodo(
  id: string,
  patch: { title?: string; completed?: boolean },
) {
  const todo = todos.find(item => item.id === id);
  if (!todo) return undefined;
  if (patch.title !== undefined) {
    const title = patch.title.trim();
    if (!title) throw new Error('Todo title cannot be empty');
    todo.title = title;
  }
  if (patch.completed !== undefined) todo.completed = patch.completed;
  return { ...todo };
}

export function deleteTodo(id: string) {
  const index = todos.findIndex(todo => todo.id === id);
  if (index === -1) return undefined;
  const [todo] = todos.splice(index, 1);
  return { ...todo };
}
