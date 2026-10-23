import type { App } from '@modern-js/mcp-apps/react';
import { useEffect, useState } from 'react';
import type { Todo } from '../../server/store';

const emptyTodos: Todo[] = [];
type Filter = 'all' | 'active' | 'completed';
type ToolCall = {
  name: 'list_todos' | 'add_todo' | 'update_todo' | 'delete_todo';
  arguments?: Record<string, unknown>;
};
const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '待完成' },
  { value: 'completed', label: '已完成' },
];

export default function Todos({
  todos: initialTodos = emptyTodos,
  mcpApp,
}: {
  todos?: Todo[];
  mcpApp?: App;
}) {
  const [todos, setTodos] = useState(initialTodos);
  const [title, setTitle] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<{ id: string; title: string } | null>(
    null,
  );
  const [confirmClear, setConfirmClear] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setTodos(initialTodos);
    setEditing(null);
    setConfirmClear(false);
  }, [initialTodos]);

  // Card calls return directly. Always read server state again, including after
  // a partially successful batch, rather than waiting for another host event.
  async function run(action: ToolCall | ToolCall[], message: string) {
    if (!mcpApp || pending) return false;
    setPending(true);
    setError('');
    setNotice('');
    let failure = '';
    let actionFailed = false;
    try {
      for (const call of Array.isArray(action) ? action : [action]) {
        const result = await mcpApp.callServerTool({ arguments: {}, ...call });
        if (result.isError) throw new Error('操作未完成，请刷新后重试。');
      }
    } catch (cause) {
      actionFailed = true;
      failure = cause instanceof Error ? cause.message : '连接失败，请重试。';
    }
    try {
      const list = await mcpApp.callServerTool({
        name: 'list_todos',
        arguments: {},
      });
      const output = list.structuredContent;
      const items =
        output && typeof output === 'object' && 'todos' in output
          ? output.todos
          : undefined;
      if (list.isError || !Array.isArray(items))
        throw new Error('无法获取最新清单，请刷新。');
      setTodos(items as Todo[]);
    } catch {
      failure = failure
        ? `${failure} 清单尚未同步，请刷新。`
        : '清单尚未同步，请刷新确认操作结果。';
    } finally {
      setPending(false);
    }
    if (failure) {
      setError(failure);
      return !actionFailed;
    }
    setNotice(message);
    return true;
  }

  async function add() {
    if (!title.trim()) return;
    if (
      await run(
        { name: 'add_todo', arguments: { title: title.trim() } },
        '已添加待办',
      )
    )
      setTitle('');
  }
  async function save() {
    if (!editing) return;
    if (!editing.title.trim()) {
      setError('待办名称不能为空。');
      return;
    }
    if (
      await run(
        {
          name: 'update_todo',
          arguments: { id: editing.id, title: editing.title.trim() },
        },
        '已保存修改',
      )
    )
      setEditing(null);
  }

  const completedCount = todos.filter(todo => todo.completed).length;
  const activeCount = todos.length - completedCount;
  const disabled = pending || !mcpApp;
  const counts = {
    all: todos.length,
    active: activeCount,
    completed: completedCount,
  };

  return (
    <section className="todo-demo" aria-busy={pending}>
      <style>{styles}</style>
      <header className="todo-header">
        <div>
          <h1>待办清单</h1>
          <p>
            {activeCount} 项待完成 · {completedCount} 项已完成
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => void run([], '清单已刷新')}
        >
          刷新
        </button>
      </header>
      <div className="todo-add" role="group" aria-label="添加待办">
        <input
          aria-label="新待办"
          placeholder="添加一件要做的事…"
          value={title}
          maxLength={120}
          disabled={disabled}
          onChange={event => setTitle(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              event.preventDefault();
              void add();
            }
          }}
        />
        <button
          className="todo-primary"
          type="button"
          disabled={disabled || !title.trim()}
          onClick={() => void add()}
        >
          添加
        </button>
      </div>
      <div className="todo-toolbar">
        <div className="todo-filters" role="group" aria-label="筛选待办">
          {filters.map(item => (
            <button
              type="button"
              key={item.value}
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
            >
              {item.label} <span>{counts[item.value]}</span>
            </button>
          ))}
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            disabled={disabled || !!editing}
            onClick={() =>
              void run(
                todos
                  .filter(todo => !todo.completed)
                  .map(todo => ({
                    name: 'update_todo',
                    arguments: { id: todo.id, completed: true },
                  })),
                '已全部标记完成',
              )
            }
          >
            全部完成
          </button>
        )}
      </div>
      <p className="todo-hint">
        使用每项右侧的状态菜单，切换「待完成」或「已完成」。
      </p>
      {[false, true]
        .filter(
          completed =>
            filter === 'all' || completed === (filter === 'completed'),
        )
        .map(completed => {
          const items = todos.filter(todo => todo.completed === completed);
          const heading = completed ? '已完成' : '待完成';
          return (
            <section className="todo-group" key={heading} aria-label={heading}>
              <h2>
                {heading}
                <span>{items.length}</span>
              </h2>
              {items.length ? (
                <ul>
                  {items.map(todo => (
                    <li key={todo.id}>
                      {editing?.id === todo.id ? (
                        <div className="todo-editor">
                          <input
                            aria-label="编辑待办名称"
                            autoFocus
                            value={editing.title}
                            maxLength={120}
                            disabled={disabled}
                            onChange={event =>
                              setEditing({
                                id: todo.id,
                                title: event.target.value,
                              })
                            }
                            onKeyDown={event => {
                              if (event.key === 'Escape') setEditing(null);
                              if (
                                event.key === 'Enter' &&
                                !event.nativeEvent.isComposing
                              ) {
                                event.preventDefault();
                                void save();
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="todo-primary"
                            disabled={disabled || !editing.title.trim()}
                            onClick={() => void save()}
                          >
                            保存
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => setEditing(null)}
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <>
                          <span
                            className={`todo-title${todo.completed ? ' is-completed' : ''}`}
                          >
                            {todo.title}
                          </span>
                          <div className="todo-actions">
                            <select
                              aria-label={`修改状态：${todo.title}`}
                              value={todo.completed ? 'completed' : 'active'}
                              disabled={disabled}
                              onChange={event =>
                                void run(
                                  {
                                    name: 'update_todo',
                                    arguments: {
                                      id: todo.id,
                                      completed:
                                        event.target.value === 'completed',
                                    },
                                  },
                                  event.target.value === 'completed'
                                    ? '已移入已完成'
                                    : '已移回待完成',
                                )
                              }
                            >
                              <option value="active">待完成</option>
                              <option value="completed">已完成</option>
                            </select>
                            <button
                              type="button"
                              aria-label={`编辑：${todo.title}`}
                              disabled={disabled}
                              onClick={() => {
                                setEditing({ id: todo.id, title: todo.title });
                                setError('');
                              }}
                            >
                              编辑
                            </button>
                            <button
                              type="button"
                              className="todo-danger"
                              aria-label={`删除：${todo.title}`}
                              disabled={disabled}
                              onClick={() =>
                                void run(
                                  {
                                    name: 'delete_todo',
                                    arguments: { id: todo.id },
                                  },
                                  '已删除待办',
                                )
                              }
                            >
                              删除
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="todo-empty">
                  {completed
                    ? '完成的事项会显示在这里。'
                    : '暂无待完成事项，添加一件要做的事吧。'}
                </p>
              )}
            </section>
          );
        })}
      {completedCount > 0 && (
        <footer className="todo-footer">
          {confirmClear ? (
            <div
              className="todo-confirm"
              role="group"
              aria-label="确认清理已完成"
            >
              <span>删除 {completedCount} 项已完成事项？</span>
              <button
                type="button"
                className="todo-danger"
                disabled={disabled}
                onClick={async () => {
                  if (
                    await run(
                      todos
                        .filter(todo => todo.completed)
                        .map(todo => ({
                          name: 'delete_todo',
                          arguments: { id: todo.id },
                        })),
                      '已清理完成事项',
                    )
                  )
                    setConfirmClear(false);
                }}
              >
                确认清理
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirmClear(false)}
              >
                取消
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={disabled || !!editing}
              onClick={() => setConfirmClear(true)}
            >
              清理已完成（{completedCount}）
            </button>
          )}
        </footer>
      )}
      <p className="todo-notice" role="status">
        {pending ? '正在同步…' : notice}
      </p>
      {error && (
        <p className="todo-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

const styles = `
.todo-demo { max-width: 680px; margin: 0 auto; padding: 24px; font-family: var(--font-sans, system-ui); color: var(--color-text-primary, inherit); }
.todo-demo * { box-sizing: border-box; }
.todo-demo h1 { margin: 0; font-size: 24px; }
.todo-demo p { line-height: 1.6; }
.todo-demo button, .todo-demo input, .todo-demo select { font: inherit; color: inherit; border: 1px solid rgba(127,127,127,.35); border-radius: 8px; background: var(--color-background-primary, transparent); }
.todo-demo button, .todo-demo select { padding: 7px 10px; cursor: pointer; }
.todo-demo button:disabled, .todo-demo select:disabled { opacity: .45; cursor: default; }
.todo-demo button:hover:not(:disabled) { background: rgba(127,127,127,.12); }
.todo-demo input { padding: 10px 12px; min-width: 0; }
.todo-demo :focus-visible { outline: 2px solid #8b7cf8; outline-offset: 3px; }
.todo-header, .todo-toolbar, .todo-add, .todo-actions, .todo-editor, .todo-confirm { display: flex; gap: 8px; align-items: center; }
.todo-header, .todo-toolbar { justify-content: space-between; }
.todo-header p { opacity: .65; margin: 6px 0 20px; font-size: 13px; }
.todo-add input, .todo-editor input { flex: 1; }
.todo-demo .todo-primary { background: #6757e8; color: white; border-color: #6757e8; }
.todo-demo .todo-primary:hover:not(:disabled) { background: #5545d4; }
.todo-toolbar { margin-top: 24px; flex-wrap: wrap; }
.todo-filters { display: flex; gap: 4px; }
.todo-filters button { border-color: transparent; }
.todo-filters button[aria-pressed="true"] { background: rgba(127,127,127,.15); border-color: rgba(127,127,127,.35); }
.todo-filters span { opacity: .65; margin-left: 4px; }
.todo-hint { opacity: .65; font-size: 12px; margin: 12px 0 20px; }
.todo-group { margin-top: 20px; }
.todo-group h2 { display: flex; align-items: center; gap: 8px; font-size: 14px; margin: 0; }
.todo-group h2 span { opacity: .65; font-size: 12px; font-weight: normal; }
.todo-group ul { list-style: none; padding: 0; margin: 8px 0; }
.todo-group li { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(127,127,127,.18); }
.todo-title { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.todo-title.is-completed { text-decoration: line-through; opacity: .6; }
.todo-actions { flex-shrink: 0; }
.todo-editor { width: 100%; }
.todo-demo .todo-danger { color: var(--color-text-danger, #e78282); }
.todo-empty { opacity: .6; font-size: 13px; padding: 8px 0; }
.todo-footer { margin-top: 20px; }
.todo-confirm { flex-wrap: wrap; font-size: 13px; }
.todo-notice { min-height: 20px; font-size: 12px; opacity: .7; margin-bottom: 0; }
.todo-error { color: var(--color-text-danger, #e78282); font-size: 13px; }
@media (max-width: 480px) { .todo-demo { padding: 16px; } .todo-group li { flex-wrap: wrap; } .todo-actions { width: 100%; } .todo-toolbar { align-items: flex-start; } }
`;
