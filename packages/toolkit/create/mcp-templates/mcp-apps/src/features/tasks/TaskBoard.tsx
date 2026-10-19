import type { App } from '@modern-js/mcp-apps/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type Task, type TaskStatus, statusLabels } from './types';

const emptyTasks: Task[] = [];

export default function TaskBoard({
  tasks = emptyTasks,
  mcpApp,
}: {
  tasks?: Task[];
  mcpApp?: App;
}) {
  const [items, setItems] = useState(tasks);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const locked = useRef(false);
  const [logs, setLogs] = useState<
    {
      name: string;
      args: Record<string, unknown>;
      response: unknown;
      elapsed: number;
      failed: boolean;
    }[]
  >([]);
  useEffect(() => setItems(tasks), [tasks]);

  const run = useCallback(
    async (name: string, args: Record<string, unknown>) => {
      if (!mcpApp || locked.current) return;
      locked.current = true;
      setBusy(true);
      setError('');
      let written = false;
      async function invoke(tool: string, arguments_: Record<string, unknown>) {
        const started = performance.now();
        let response: unknown;
        let failed = false;
        try {
          const result = await mcpApp!.callServerTool({
            name: tool,
            arguments: arguments_,
          });
          response = result;
          failed = Boolean(result.isError);
          return result;
        } catch (cause) {
          failed = true;
          response = {
            error: cause instanceof Error ? cause.message : String(cause),
          };
          throw cause;
        } finally {
          const elapsed = Math.round(performance.now() - started);
          setLogs(previous =>
            [
              { name: tool, args: arguments_, response, elapsed, failed },
              ...previous,
            ].slice(0, 10),
          );
        }
      }
      try {
        const result = await invoke(name, args);
        if (result.isError)
          throw new Error(
            result.content
              ?.filter(item => item.type === 'text')
              .map(item => item.text)
              .join('\n') || '操作失败',
          );
        written = name !== 'list_tasks';
        if (name === 'create_task') setTitle('');
        // Read after writing: render the server's current state, never an optimistic edit.
        const latest = written ? await invoke('list_tasks', {}) : result;
        if (latest.isError) throw new Error('重新查询失败，请点击刷新。');
        const data = latest.structuredContent as { tasks?: Task[] } | undefined;
        if (!Array.isArray(data?.tasks))
          throw new Error('服务端没有返回任务列表。');
        setItems(data.tasks);
      } catch (cause) {
        setError(
          `${written ? '写入已成功，但刷新失败。' : '未能确认操作结果，请先刷新再决定是否重试。'} ${cause instanceof Error ? cause.message : '请求失败'}`,
        );
      } finally {
        locked.current = false;
        setBusy(false);
      }
    },
    [mcpApp],
  );

  useEffect(() => {
    void run('list_tasks', {});
  }, [run]);

  return (
    <section
      style={{
        fontFamily: 'system-ui',
        padding: 24,
        maxWidth: 720,
        margin: '0 auto',
        color: '#17233b',
        background: '#f5f7fb',
        borderRadius: 16,
      }}
      aria-busy={busy}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1 style={{ marginBottom: 6 }}>任务看板</h1>
          <p>
            {items.filter(task => task.status === 'done').length} /{' '}
            {items.length} 已完成
          </p>
        </div>
        <button
          type="button"
          disabled={busy || !mcpApp}
          onClick={() => run('list_tasks', {})}
        >
          刷新
        </button>
      </header>
      <p style={{ fontSize: 13 }}>
        共享演示数据 · 保存到服务端文件，重新打开后可查询
      </p>
      {!mcpApp && <p>请在 MCP Apps 客户端中调用 list_tasks 来操作看板。</p>}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          aria-label="新任务名称"
          onKeyDown={event => {
            if (
              event.key === 'Enter' &&
              !event.nativeEvent.isComposing &&
              title.trim() &&
              !busy
            ) {
              event.preventDefault();
              void run('create_task', { title: title.trim() });
            }
          }}
          placeholder="下一件要完成的事…"
          maxLength={120}
          value={title}
          onChange={event => setTitle(event.target.value)}
          disabled={busy || !mcpApp}
          style={{ flex: 1, minWidth: 0, padding: 10 }}
        />
        <button
          type="button"
          disabled={busy || !mcpApp || !title.trim()}
          onClick={() => {
            void run('create_task', { title: title.trim() });
          }}
        >
          添加任务
        </button>
      </div>
      {error && (
        <p role="alert" style={{ color: '#a52020' }}>
          {error}
        </p>
      )}
      <output>{busy ? '正在同步…' : `${items.length} 个任务`}</output>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {items.map(task => (
          <li
            key={task.id}
            style={{
              padding: 16,
              marginBottom: 10,
              background: '#fff',
              border: '1px solid #dde3ed',
              borderRadius: 10,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ overflowWrap: 'anywhere', flex: '1 1 180px' }}>
              <strong>{task.title}</strong>
              <div style={{ fontSize: 12, color: '#526078', marginTop: 6 }}>
                {task.id} · {task.createdAt}
              </div>
            </div>
            <select
              aria-label={`${task.title}的状态`}
              value={task.status}
              disabled={busy || !mcpApp}
              onChange={event =>
                run('update_task', {
                  id: task.id,
                  status: event.target.value as TaskStatus,
                })
              }
              style={{ padding: 8 }}
            >
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
      {items.length === 0 && <p>暂无任务，可以先添加一个。</p>}
      <h2>ServerTool 调用记录</h2>
      <p>以下参数、返回值和耗时来自本次真实调用，最多保留 10 条。</p>
      {logs.length === 0 && <p>连接 MCP 客户端后开始记录。</p>}
      {logs.map((log, index) => (
        <details
          key={`${logs.length}-${index}-${log.name}`}
          open={index === 0}
          style={{ marginTop: 12 }}
        >
          <summary>
            {log.name} · {log.failed ? '失败' : '成功'} · {log.elapsed} ms
          </summary>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {JSON.stringify(
              {
                request: { name: log.name, arguments: log.args },
                response: log.response,
              },
              null,
              2,
            )}
          </pre>
        </details>
      ))}
    </section>
  );
}
