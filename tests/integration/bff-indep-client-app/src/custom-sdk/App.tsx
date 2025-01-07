import { useLoader } from '@modern-js/runtime';
import hello from 'bff-api-app/api/index';
import { configure } from 'bff-api-app/runtime';

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
  return <div className="hello">interceptor return：{message}</div>;
};

export default App;
