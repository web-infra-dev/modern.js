export interface Todo {
  id: string;
  title: string;
  completed: boolean;
}
const todos: Todo[] = [
  { id: '1', title: '打开本地 React 卡片', completed: false },
  { id: '2', title: '打开 Module Federation 卡片', completed: false },
];
export const listTodos = () => todos.map(todo => ({ ...todo }));
export function addTodo(title: string) {
  const todo = { id: crypto.randomUUID(), title, completed: false };
  todos.push(todo);
  return { ...todo };
}
