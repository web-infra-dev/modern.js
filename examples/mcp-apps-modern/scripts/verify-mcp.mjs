import assert from 'node:assert/strict';

const endpoint =
  process.argv[2] ?? process.env.MCP_ENDPOINT ?? 'http://localhost:8080/mcp';
let nextId = 0;
async function rpc(method, params = {}, notification = false) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      ...(notification ? {} : { id: ++nextId }),
      method,
      params,
    }),
    signal: AbortSignal.timeout(10000),
  });
  const body = await response.text();
  assert.ok(response.ok, `${method}: HTTP ${response.status}: ${body}`);
  if (notification) {
    assert.equal(response.status, 202);
    return;
  }
  const message = JSON.parse(body);
  assert.ok(!message.error, `${method}: ${JSON.stringify(message.error)}`);
  assert.ok(
    !message.result?.isError,
    `${method}: ${JSON.stringify(message.result)}`,
  );
  console.log(
    `\n${method}\n${JSON.stringify(
      method === 'resources/read'
        ? {
            contents: message.result.contents.map(({ text, ...metadata }) => ({
              ...metadata,
              htmlBytes: Buffer.byteLength(text),
              preview: text.slice(0, 160),
            })),
          }
        : message.result,
      null,
      2,
    )}`,
  );
  return message.result;
}

await rpc('initialize', {
  protocolVersion: '2025-11-25',
  capabilities: {},
  clientInfo: { name: 'mcp-template-check', version: '1' },
});
await rpc('notifications/initialized', {}, true);
const { tools } = await rpc('tools/list');
for (const name of ['greet', 'add_numbers']) {
  assert.ok(
    tools.some(tool => tool.name === name),
    `Missing template tool: ${name}`,
  );
}
const greeting = await rpc('tools/call', {
  name: 'greet',
  arguments: { name: 'Modern.js' },
});
assert.equal(greeting.structuredContent.message, 'Hello, Modern.js!');
const addition = await rpc('tools/call', {
  name: 'add_numbers',
  arguments: { a: 2, b: 3 },
});
assert.equal(addition.structuredContent.sum, 5);
for (const tool of tools) {
  const uri = tool._meta?.ui?.resourceUri;
  if (!uri) continue;
  const { contents } = await rpc('resources/read', { uri });
  assert.equal(contents[0].mimeType, 'text/html;profile=mcp-app');
  assert.ok(contents[0].text.includes('<script'), `${uri}: missing UI scripts`);
}
console.log(
  `\nPASS: ${endpoint} — both tools returned the expected results; declared UI resources are readable.`,
);
