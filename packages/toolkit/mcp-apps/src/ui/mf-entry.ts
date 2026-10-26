import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { createMfView, type MfViewConfig } from './mf';

const root = document.getElementById('root');
const configElement = document.getElementById('modern-mcp-config');
if (!root || !configElement?.textContent) {
  throw new Error('MCP shell requires a root element and MF configuration');
}

// The resource reader injects this configuration before returning the HTML.
const config: MfViewConfig = JSON.parse(configElement.textContent);
createRoot(root).render(createElement(createMfView(config)));
