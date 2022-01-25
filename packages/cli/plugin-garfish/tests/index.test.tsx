import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createApp } from '@modern-js/runtime-core';
import fetchMock from 'jest-fetch-mock';
import '@testing-library/jest-dom';
// https://stackoverflow.com/questions/49034907/fetch-mock-does-not-mock-my-fetch
import {
  Link,
  Route,
  Switch,
  useLocation,
  MemoryRouter,
} from '@modern-js/plugin-router';
// import { createMemoryHistory } from 'history';
import ModernGarfishPlugin, { useLegacyModuleApps } from '../src/runtime';
import {
  TABLE_LIST_ESCAPE_NODE,
  TABLE_LIST_HTML,
  TABLE_LIST_ROOT_NODE,
} from './resource/table';
import {
  DASHBOARD_ESCAPE_NODE,
  DASHBOARD_HTML,
  DASHBOARD_ROOT_NODE,
} from './resource/dashboard';

global.React = React;
global.fetch = fetchMock;

const dashboardPath = 'http://garfish-mock.com/dashboard';
const tableListPath = 'http://garfish-mock.com/table-list';

describe('plugin-micro-frontend', () => {
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
      } else {
        return Promise.resolve({
          status: 404,
          body: 'Not Found',
        });
      }
    });

    fetchMock.doMock();
  });

  // testing-library.com/docs/example-react-router/
  test('legacyModule hooks', async () => {
    const tableListModuleInfo = {
      name: 'Dashboard',
      entry: dashboardPath,
    };
    const dashBoardModuleInfo = {
      name: 'TableList',
      entry: tableListPath,
    };
    const HomeTitle = 'Micro home page';
    fetchMock.doMock();

    const microFrontendConfig = {
      apps: [tableListModuleInfo, dashBoardModuleInfo],
      LoadingComponent() {
        return <div data-testid="loading-id">loading</div>;
      },
    };

    const App = () => {
      const Home = () => <div data-testid="home-title">{HomeTitle}</div>;
      const {
        apps,
        Components: { Dashboard, TableList },
      } = useLegacyModuleApps();

      const LocationDisplay = () => {
        const location = useLocation();
        return <div data-testid="location-display">{location.pathname}</div>;
      };

      if (apps.length > 0) {
        expect(apps[0].name).toBe(tableListModuleInfo.name);
        expect(apps[1].name).toBe(dashBoardModuleInfo.name);
        expect(apps[0].entry).toBe(tableListModuleInfo.entry);
        expect(apps[1].entry).toBe(dashBoardModuleInfo.entry);
      }

      return (
        <MemoryRouter>
          <div id="app">
            <Link to="/">home</Link>
            <Link data-testid="dashboard-link" to="/dashboard">
              dashboard
            </Link>
            <Link data-testid="table-list-link" to="/table-list">
              table-list
            </Link>
            <Switch>
              <Route exact={true} path="/">
                <Home />
              </Route>
              <Route path="/dashboard">
                <Dashboard />
              </Route>
              <Route path="/table-list">
                <TableList />
              </Route>
              <LocationDisplay />
            </Switch>
          </div>
        </MemoryRouter>
      );
    };

    const AppWrapper = createApp({
      plugins: [ModernGarfishPlugin(microFrontendConfig)],
    })(App);

    const { unmount } = render(<AppWrapper />);
    expect(screen.getByTestId('home-title')).toBeInTheDocument();
    const leftClick = { button: 0 };
    userEvent.click(screen.getByTestId('dashboard-link'), leftClick);
    expect(await screen.findByText('loading')).toBeInTheDocument();
    expect(
      await screen.findByText(DASHBOARD_ROOT_NODE.text),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(DASHBOARD_ESCAPE_NODE.text),
    ).toBeInTheDocument();
    userEvent.click(screen.getByTestId('table-list-link'));
    expect(await screen.findByText('loading')).toBeInTheDocument();
    expect(
      await screen.findByText(TABLE_LIST_ROOT_NODE.text),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(TABLE_LIST_ESCAPE_NODE.text),
    ).toBeInTheDocument();

    unmount();
    expect(screen.queryByText('loading')).toBeNull();
    expect(screen.queryByText(DASHBOARD_ROOT_NODE.text)).toBeNull();
    expect(screen.queryByText(DASHBOARD_ESCAPE_NODE.text)).toBeNull();
    expect(screen.queryByText(TABLE_LIST_ROOT_NODE.text)).toBeNull();
    expect(screen.queryByText(TABLE_LIST_ESCAPE_NODE.text)).toBeNull();
  });
});
