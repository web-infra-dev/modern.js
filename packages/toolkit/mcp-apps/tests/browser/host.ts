// Test-only host using the official SDK. Never shipped in the npm package.
import {
  AppBridge,
  PostMessageTransport,
} from '@modelcontextprotocol/ext-apps/app-bridge';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { readRpcResponse } from './rpc';

async function rpc(method: string, params: Record<string, unknown> = {}) {
  const response = await fetch('/rpc', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method,
      params,
    }),
  });
  return readRpcResponse(response);
}

async function main() {
  const output = document.querySelector('output');
  const iframe = document.querySelector('iframe');
  if (!output || !iframe?.contentWindow)
    throw new Error('Missing fixture elements');
  await rpc('initialize', {
    protocolVersion: '2025-11-25',
    capabilities: {},
    clientInfo: { name: 'browser-fixture', version: '1' },
  });
  const tools = await rpc('tools/list');
  const resource = await rpc('resources/read', {
    uri: tools.tools[0]._meta.ui.resourceUri,
  });
  const result = await rpc('tools/call', {
    name: 'greet',
    arguments: { name: 'Ada' },
  });
  const bridge = new AppBridge(
    null,
    { name: 'official-sdk-test-host', version: '1' },
    { serverTools: {} },
  );
  bridge.oncalltool = async params => {
    const next = (await rpc('tools/call', params)) as CallToolResult;
    output.textContent = `UI called ${params.name}: ${JSON.stringify(next.structuredContent)}`;
    return next;
  };
  bridge.oninitialized = async () => {
    await bridge.sendToolInput({ arguments: { name: 'Ada' } });
    await bridge.sendToolResult(result);
    output.textContent = 'Host connected; initial tool result delivered';
  };
  bridge.onerror = error => {
    output.textContent = `Bridge error: ${error.message}`;
  };
  bridge.onsizechange = ({ height }) => {
    if (height) iframe.style.height = `${height}px`;
  };
  await bridge.connect(
    new PostMessageTransport(iframe.contentWindow, iframe.contentWindow),
  );
  iframe.srcdoc = resource.contents[0].text;
}

main().catch(error => {
  const output = document.querySelector('output');
  if (output) output.textContent = `Fixture error: ${String(error)}`;
  console.error(error);
});
