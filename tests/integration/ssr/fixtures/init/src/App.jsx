import { useRuntimeContext } from '@modern-js/runtime';

const App = () => {
  const context = useRuntimeContext();
  return (
    <div className="text-center" id="data">
      Hello, Modern.js. env name: {context.initialData?.name}
    </div>
  );
};

App.init = context => {
  const { request } = context.ssrContext;

  if (context.isBrowser) {
    return {
      name: 'client',
    };
  } else if (!request.query.browser) {
    return {
      name: 'server',
    };
  }

  return null;
};

export default App;
