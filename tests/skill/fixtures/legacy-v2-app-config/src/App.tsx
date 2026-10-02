import { useRuntimeContext } from '@modern-js/runtime';
import { fetchUser } from '@modern-js/runtime/bff';

const App = () => {
  const { context } = useRuntimeContext();
  return <div>Hello {String(context.request)}</div>;
};

App.config = {
  router: {
    supportHtml5History: true,
  },
};

App.init = context => {
  context.foo = 'bar';
};

export default App;
