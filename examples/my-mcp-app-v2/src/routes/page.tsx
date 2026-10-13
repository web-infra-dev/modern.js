import TaskBoard from '../features/tasks/TaskBoard';

export default function Page() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 32 }}>
      <h1>Modern.js 任务管理 MCP App</h1>
      <p>
        连接 MCP
        客户端后，发送“列出任务并展示看板”。支持创建任务、修改状态和刷新。
      </p>
      <p>
        Endpoint: <code>/mcp</code>
      </p>
      <p>下方是只读外观预览；真实任务数据和交互在 MCP 客户端中加载。</p>
      <TaskBoard
        tasks={[
          { id: 'preview-1', title: '体验任务卡片', status: 'todo' },
          { id: 'preview-2', title: '连接 ChatGPT', status: 'in_progress' },
          { id: 'preview-3', title: '定义 MCP 工具', status: 'done' },
        ]}
      />
    </main>
  );
}
