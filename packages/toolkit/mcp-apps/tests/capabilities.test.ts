import { it, expect, rs } from '@rstest/core';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createMcpView } from '../src/ui/react';

const observed = rs.hoisted(() => ({ capabilities: undefined as unknown }));
rs.mock('@modelcontextprotocol/ext-apps/react', () => ({
  useApp(options: { capabilities: unknown }) {
    observed.capabilities = options.capabilities;
    return { app: undefined, isConnected: false };
  },
  useHostStyles() {},
  useHostFonts() {},
  useDocumentTheme() {},
  useHostStyleVariables() {},
}));
const info = { name: 'test', version: '1' };
it('advertises inline and fullscreen by default', () => {
  renderToStaticMarkup(createElement(createMcpView(() => null, info)));
  expect(observed.capabilities).toEqual({
    availableDisplayModes: ['inline', 'fullscreen'],
  });
});
it('allows explicit display mode overrides and additional capabilities', () => {
  renderToStaticMarkup(
    createElement(
      createMcpView(() => null, info, {
        availableDisplayModes: ['inline'],
        tools: { listChanged: true },
      }),
    ),
  );
  expect(observed.capabilities).toEqual({
    availableDisplayModes: ['inline'],
    tools: { listChanged: true },
  });
});
it('keeps default display modes when only additional capabilities are declared', () => {
  renderToStaticMarkup(
    createElement(
      createMcpView(() => null, info, { experimental: { test: {} } }),
    ),
  );
  expect(observed.capabilities).toEqual({
    availableDisplayModes: ['inline', 'fullscreen'],
    experimental: { test: {} },
  });
});
