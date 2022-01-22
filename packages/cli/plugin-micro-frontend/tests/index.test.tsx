import React from 'react';
import { render, screen } from '@testing-library/react';
import { createApp } from '@modern-js/runtime-core';
import fetchMock from 'jest-fetch-mock';
import '@testing-library/jest-dom';
// https://stackoverflow.com/questions/49034907/fetch-mock-does-not-mock-my-fetch
import { Router } from '@modern-js/plugin-router';
import { createBrowserHistory } from 'history';
import microPlugin, { useLegacyModuleApps } from '../src/runtime';
import { TableListHTML } from './resource/table';
import {
  DashBoardHTML,
  DashBoardRootNode,
  DashBoardEscapeNode,
} from './resource/dashboard';

global.React = React;
global.fetch = fetchMock;

// https://www.npmjs.com/package/jest-fetch-mock
function mockResource(
  code: string,
  contentType = 'application/javascript',
  id,
) {
  const url = `http://garfish-mock.com/hello/${id}`;
  fetchMock.mockIf(url, () =>
    Promise.resolve({
      body: code,
      headers: {
        'Content-Type': contentType,
      },
    }),
  );
  return url;
}

describe('plugin-micro-frontend', () => {
  // https://testing-library.com/docs/example-react-router/
  test('legacyModule hooks', async () => {
    const tableListModuleInfo = {
      name: 'Dashboard',
      entry: mockResource(TableListHTML, 'text/html', 'Dashboard'),
    };
    const dashBoardModuleInfo = {
      name: 'TableList',
      entry: mockResource(DashBoardHTML, 'text/html', 'TableList'),
    };
    fetchMock.doMock();

    const microFrontendConfig = {
      manifest: {
        modules: [tableListModuleInfo, dashBoardModuleInfo],
      },
      LoadingComponent() {
        return <div>loading</div>;
      },
    };

    const App = () => {
      const history = createBrowserHistory();
      const {
        apps,
        appComponents: { Dashboard },
      } = useLegacyModuleApps();
      expect(apps[0].name).toBe(tableListModuleInfo.name);
      expect(apps[1].name).toBe(dashBoardModuleInfo.name);
      expect(apps[0].entry).toBe(tableListModuleInfo.entry);
      expect(apps[1].entry).toBe(dashBoardModuleInfo.entry);
      return (
        <Router history={history}>
          <div id="app">
            <Dashboard />
          </div>
        </Router>
      );
    };

    const AppWrapper = createApp({
      plugins: [microPlugin(microFrontendConfig)],
    })(App);

    const { unmount } = render(<AppWrapper />);
    expect(await screen.findByText('loading')).toBeInTheDocument();
    expect(await screen.findByText(DashBoardRootNode.text)).toBeInTheDocument();
    expect(
      await screen.findByText(DashBoardEscapeNode.text),
    ).toBeInTheDocument();
    unmount();
    expect(screen.queryByText('loading')).toBeNull();
    expect(screen.queryByText(DashBoardRootNode.text)).toBeInTheDocument();
    expect(screen.queryByText(DashBoardEscapeNode.text)).toBeNull();
  });
});
