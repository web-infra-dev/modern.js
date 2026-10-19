import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, it } from '@rstest/core';

it('renders the shipped debugger without a global React variable', () => {
  const html = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import { createElement } from 'react';
    import { renderToStaticMarkup } from 'react-dom/server';
    import { McpDebugger } from './dist/esm/debug.mjs';
    if ('React' in globalThis) throw new Error('Unexpected React global');
    console.log(renderToStaticMarkup(createElement(McpDebugger, { endpoint: '/mcp' })));
  `,
    ],
    {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
      encoding: 'utf8',
    },
  );
  expect(html).toContain('MCP Apps Debugger');
  expect(html).toContain('Connect &amp; discover');
});
