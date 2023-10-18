import hello from '@api/index';
import { configure } from '@modern-js/runtime/bff';
import { useLoader } from '@modern-js/runtime';

configure({
  interceptor(request) {
    return async (url, params) => {
      const res = await request(url, params);
      const data = await res.json();
      data.message = 'Hello Custom SDK';
      return data;
    };
  },
});

const App = () => {
  const { data } = useLoader(async () => {
    const res = await hello();
    return res;
  });
  const { message = 'bff-express' } = data || {};
  return <div className="hello">{message}</div>;
};

export default App;
