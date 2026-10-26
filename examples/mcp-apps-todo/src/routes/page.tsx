export default function Page() {
  return (
    <main
      style={{
        maxWidth: 800,
        margin: '64px auto',
        padding: '0 24px',
        fontFamily: 'system-ui',
        lineHeight: 1.8,
      }}
    >
      <h1>Modern.js MCP Apps · Todo</h1>
      <p>本地 React 卡片和 Module Federation 卡片共用同一份 Todo 数据。</p>
      <p>
        <a href="/mcp/inspector">打开 MCP Apps Inspector →</a>
      </p>
      <ol>
        <li>点击 Connect &amp; discover 发现 tools。</li>
        <li>
          选择 <code>local_todos</code>，点击 Run tool 查看本地卡片。
        </li>
        <li>
          在卡片内输入标题，点击 Add todo 调用 <code>add_todo</code>。
        </li>
        <li>
          选择 <code>list_todos</code>，查看 MF 卡片和刚才新增的数据。
        </li>
      </ol>
      <p>
        MCP 地址：<code>/api/mcp</code>
      </p>
      <p>
        UI 配置：<code>mcp-views.json</code>
      </p>
      <p>
        官方 SDK 服务端：<code>api/lambda/mcp.ts</code>
      </p>
      <p>
        React 卡片：<code>src/components/Todos.tsx</code>
      </p>
      <p>示例数据保存在内存中，重启服务后恢复初始数据。</p>
    </main>
  );
}
