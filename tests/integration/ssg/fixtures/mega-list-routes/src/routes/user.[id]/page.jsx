import { useLoaderData, useLocation } from '@modern-js/runtime/router';

const App = () => {
  useLoaderData();
  const location = useLocation();
  return (
    <div className="text-center" id="data">
      {location.pathname}
    </div>
  );
};

export default App;
