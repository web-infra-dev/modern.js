import { useLoaderData } from '@modern-js/runtime/router';

const App = () => {
  const data = useLoaderData();
  return (
    <div className="text-center" id="data">
      {data}
    </div>
  );
};

export default App;
