// eslint-disable-next-line no-unused-vars
import { Link, Outlet } from '@modern-js/runtime/router';

const App = () => {
  return (
    <div>
      <p className="title">_app</p>
      <Link id="kobe" to="/users/kobe">
        kobe
      </Link>
      <br />
      <Link id="lebron" to="/users/lebron">
        lebron
      </Link>
      <Outlet />
    </div>
  );
};

export default App;
