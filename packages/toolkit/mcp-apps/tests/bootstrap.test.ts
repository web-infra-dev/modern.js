import { it, expect, rs } from '@rstest/core';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createMcpView } from '../src/ui/react';
const state = rs.hoisted(() => ({ connected: true }));
rs.mock('@modelcontextprotocol/ext-apps/react', () => ({
  useApp() {
    return {
      app: { getHostContext: () => ({}) },
      isConnected: state.connected,
    };
  },
  useHostStyles() {},
  useHostFonts() {},
  useDocumentTheme() {},
  useHostStyleVariables() {},
}));
it('mounts connected applications without tool results but preserves the card initialization gate', () => {
  const View = () => createElement('p', {}, 'Connected application');
  const appInfo = { name: 'url', version: '1' };
  expect(
    renderToStaticMarkup(createElement(createMcpView(View, appInfo))),
  ).toBe('');
  expect(
    renderToStaticMarkup(
      createElement(
        createMcpView(View, appInfo, {}, { bootstrap: 'connected' }),
      ),
    ),
  ).toContain('Connected application');
  state.connected = false;
  expect(
    renderToStaticMarkup(
      createElement(
        createMcpView(View, appInfo, {}, { bootstrap: 'connected' }),
      ),
    ),
  ).toBe('');
});
