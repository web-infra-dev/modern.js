import {
  // Switch, Route,
  Link,
} from '@modern-js/plugin-router-legacy';

import './App.css';

const App = () => (
  <>
    <Link to={'/a'}>去 A</Link>
    <Link to={'/b'}>去 B</Link>
    {/* <Switch>
      <Route exact={true} path="/">
        <div className="container-box">
          <h1>首页</h1>
          <Link to={'/a'}>A page</Link>
          <Link to={'/b'}>B page</Link>
        </div>
      </Route>
      <Route exact={true} path="/a">
        <div className="container-box">
          <h1>APP - a 路由</h1>
        </div>
      </Route>
      <Route exact={true} path="/b">
        <div className="container-box">
          <h1>APP - a 路由</h1>
        </div>
      </Route>
      <Route path="*">
        <div>404</div>
      </Route>
    </Switch> */}
  </>
);

export default App;
