import { Switch, Route } from '@modern-js/runtime/router-v5';
import './App.css';

const App = () => (
  <Switch>
    <Route exact={true} path="/">
      <div className="container">
        <main>
          <div className="logo">
            <img
              src={
                '//p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/8361eeb82904210b4f55fab888fe8416.png~tplv-uwbnlip3yd-webp.webp'
              }
            />
          </div>
          <p className="description">Tablelist home page</p>
        </main>
      </div>
    </Route>
    <Route path="*">
      <div>404</div>
    </Route>
  </Switch>
);

export default App;
