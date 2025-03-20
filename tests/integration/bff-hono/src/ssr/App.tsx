import hello from '@api/index';
import { useLoader } from '@modern-js/runtime';

const App = () => {
  const { data } = useLoader(async () => {
    const res = await hello();
    return res;
  });
  const { message = 'bff-hono' } = data || {};
  return <div className="hello">{message}</div>;
};

export default App;
