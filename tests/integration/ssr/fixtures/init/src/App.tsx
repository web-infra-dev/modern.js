import { type RuntimeContext, useRuntimeContext } from '@modern-js/runtime';

const App = () => {
  const { initialData, context } = useRuntimeContext();

  console.log(context.request.url, '!!!');
  return (
    <div className="text-center" id="data">
      Hello, Modern.js. env name: {(initialData?.name || '') as string}
    </div>
  );
};

App.init = (context: RuntimeContext) => {
  const { request } = context.context!;

  if (context.isBrowser && !context?.initialData?.name) {
    return {
      name: 'client',
    };
  } else if (!request.query.browser) {
    return {
      name: 'server',
    };
  }

  return {};
};

export default App;
