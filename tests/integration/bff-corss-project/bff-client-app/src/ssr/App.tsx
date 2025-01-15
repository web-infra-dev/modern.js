import { useLoader } from '@modern-js/runtime';
import hello from 'bff-api-app/api/index';
import { configure } from 'bff-api-app/runtime';

configure({
  interceptor(request) {
    return async (url, params) => {
      let path = url.toString();
      path = path.toString().replace('3399', '3401');

      const res = await request(path, params);
      const data = await res.json();
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
