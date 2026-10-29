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
      <p>使用支持 MCP Apps 的客户端连接下方 MCP 地址，调用工具并展示卡片。</p>
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
