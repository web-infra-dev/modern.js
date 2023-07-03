import { useModuleApps } from '@modern-js/runtime/garfish';
import { Switch, Route, Link } from '@modern-js/runtime/router-v5';
import DashboardButton from 'dashboardApp/share-button';
import './App.css';

function Home() {
  return (
    <div style={{ textAlign: 'center', padding: '30px' }}>Main Home page</div>
  );
}

const App: React.FC = () => {
  const { Dashboard, MApp } = useModuleApps();
  return (
    <div>
      <div style={{ textAlign: 'center' }}>
        <Link data-test="link-home" to="/">
          Home |{' '}
        </Link>{' '}
        &nbsp;
        <Link data-test="link-dashboard" to="/dashboard">
          Dashboard |{' '}
        </Link>{' '}
        &nbsp;
        <Link data-test="link-dashboard-detail" to="/dashboard/detail">
          Dashboard detail |{' '}
        </Link>
        <Link data-test="link-tablelist" to="/tablelist">
          Table |{' '}
        </Link>{' '}
        &nbsp;
        <Link data-test="link-shared" to="/shared">
          Shared
        </Link>{' '}
        &nbsp;
      </div>
      <Switch>
        <Route path="/" exact={true}>
          <Home />
        </Route>
        <Route path="/dashboard" exact={false}>
          <Dashboard
            msg={'hello world from main app'}
            loadable={{
              loading: ({ _pastDelay, error }: any) => {
                if (error) {
                  return <div>error: {error?.message}</div>;
                } else {
                  return <div>dashboard loading</div>;
                }
              },
            }}
          />
        </Route>
        <Route path="/shared" exact={false}>
          <DashboardButton />
        </Route>
        {/* <Route path="/tablelist" exact={false}>
          <TableList
            loadable={{
              loading: ({ pastDelay, error }: any) => {
                if (error) {
                  return <div>error: {error?.message}</div>;
                } else if (pastDelay) {
                  return <div>tablelist loading</div>;
                } else {
                  return <div>empty placeholder</div>;
                }
              },
            }}
          />
        </Route> */}
      </Switch>
      <MApp
        msg={'hello world'}
        loadable={{
          loading: ({ pastDelay, error }: any) => {
            if (error) {
              console.error(error);
              return <div>error: {error?.message}</div>;
            } else if (pastDelay) {
              return <div>tablelist loading</div>;
            } else {
              return <div>tablelist empty placeholder</div>;
            }
          },
        }}
      />
    </div>
  );
};

// defineConfig(App, {
//   masterApp: {
//     // apps: [
//     //   {
//     //     name: 'Dashboard',
//     //     activeWhen: '/dashboard',
//     //     entry: 'http://localhost:8081/',
//     //   },
//     //   {
//     //     name: 'TableList',
//     //     activeWhen: '/tablelist',
//     //     entry: 'http://localhost:8082',
//     //   },
//     // ],
//     manifest: {
//       LoadingComponent() {
//         return <div>loading</div>;
//       },
//     },
//   },
// });

console.log((App as any).config);

export default App;
