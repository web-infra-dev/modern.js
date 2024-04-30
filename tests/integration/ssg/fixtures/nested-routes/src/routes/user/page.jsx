import { useLoaderData } from '@modern-js/runtime/router';

const App = () => {
  // eslint-disable-next-line prettier/prettier
  const data = useLoaderData() as string;
  return (
    <div className="text-center" id="data">
      {data}
    </div>
  );
};

export default App;
