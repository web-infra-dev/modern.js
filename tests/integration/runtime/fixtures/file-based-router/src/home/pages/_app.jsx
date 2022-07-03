// eslint-disable-next-line no-unused-vars
import { Link } from '@modern-js/runtime/router';

const App = ({ Component, ...pageProps }) => {
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
      <Component {...pageProps} />
    </div>
  );
};

export default App;
