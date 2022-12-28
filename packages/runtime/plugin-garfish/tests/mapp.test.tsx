import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { createApp } from '@modern-js/runtime';
import fetchMock from 'jest-fetch-mock';
import '@testing-library/jest-dom';
// https://stackoverflow.com/questions/49034907/fetch-mock-does-not-mock-my-fetch
import { Link, MemoryRouter } from '@modern-js/plugin-router-v5/runtime';
import ModernGarfishPlugin, { useModuleApp } from '../src/runtime';
import { useModuleApps } from '../src';
import {
  TABLE_LIST_ESCAPE_NODE,
  TABLE_LIST_HTML,
  TABLE_LIST_ROOT_NODE,
} from './resource/table';
import { DASHBOARD_HTML } from './resource/dashboard';
import {
  USER_INFO_ESCAPE_NODE,
  USER_INFO_HTML,
  USER_INFO_ROOT_NODE,
} from './resource/userInfo';

global.React = React;
global.fetch = fetchMock as any;


const tableListPath = 'http://garfish-mock.com/table-list';
const userInfoPath = 'http://garfish-mock.com/user-info';

describe('plugin-garfish', () => {
  beforeEach(() => {
    // https://www.npmjs.com/package/jest-fetch-mock
    fetchMock.mockIf(/^https?:\/\/garfish-mock.com.*$/, req => {
      if (req.url.endsWith('/dashboard')) {
        return Promise.resolve({
          body: DASHBOARD_HTML,
          headers: {
            'Content-Type': 'text/html',
          },
        });
      } else if (req.url.endsWith('/table-list')) {
        return Promise.resolve({
          body: TABLE_LIST_HTML,
          headers: {
            'Content-Type': 'text/html',
          },
        });
      } else if (req.url.endsWith('/user-info')) {
        return Promise.resolve({
          body: USER_INFO_HTML,
          headers: {
            'Content-Type': 'text/html',
          },
        });
      } else {
        return Promise.resolve({
          status: 404,
          body: 'Not Found',
        });
      }
    });

    fetchMock.doMock();
  });

  test('legacyModule hooks MApp', async () => {
    const userInfo = {
      name: 'UserInfo2',
      activeWhen: '/legacy-user-info',
      entry: userInfoPath,
    };
    const tableList2 = {
      name: 'tablist2',
      activeWhen: '/legacy-table-list',
      entry: tableListPath,
    };

    const microFrontendConfig = {
      apps: [userInfo, tableList2],
      LoadingComponent() {
        return <div data-testid="loading-id">loading</div>;
      },
    };

    const App = () => {
      const { MApp } = useModuleApps();
      const NMApp = useModuleApp();
      expect(MApp).toBe(NMApp);

      return (
        <MemoryRouter>
          <div id="app">
            <Link to="/">home</Link>
            <Link data-testid="dashboard-link" to="/dashboard">
              dashboard
            </Link>
            <Link data-testid="table-list-link" to="/legacy-table-list">
              table-list
            </Link>
            <Link data-testid="user-info-link" to="/legacy-user-info">
              user-info
            </Link>
            <MApp />
          </div>
        </MemoryRouter>
      );
    };

    let unmount = () => {};
    await act(async () => {
      const AppWrapper = createApp({
        plugins: [ModernGarfishPlugin(microFrontendConfig)],
      })(App);
      const res = render(<AppWrapper />);
      unmount = res.unmount;
    });
    await act(async () => {
      history.pushState(null, '', '/legacy-user-info');
    });
    expect(
      await screen.findByText(USER_INFO_ROOT_NODE.text),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(USER_INFO_ESCAPE_NODE.text),
    ).toBeInTheDocument();

    await act(async () => {
      history.pushState(null, '', '/legacy-table-list');
    });
    expect(screen.queryByText(USER_INFO_ROOT_NODE.text)).toBeNull();
    expect(screen.queryByText(USER_INFO_ESCAPE_NODE.text)).toBeNull();

    expect(
      await screen.findByText(TABLE_LIST_ROOT_NODE.text),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(TABLE_LIST_ESCAPE_NODE.text),
    ).toBeInTheDocument();

    unmount();
  });
});
