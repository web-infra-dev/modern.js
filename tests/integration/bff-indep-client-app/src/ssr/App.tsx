import { useLoader } from '@modern-js/runtime';
import hello from 'bff-api-app/index';
import { configure } from 'bff-api-app/runtime';
import user from 'bff-api-app/user/index';
import { useEffect } from 'react';

configure({
  interceptor(request) {
    return async (url, params) => {
      let path = url;
      if (!url.toString().includes('http')) {
        path = `http://127.0.0.1:8080${url}`;
      }
      const res = await request(path, params);
      return res.json();
    };
  },
});

const App = () => {
  const { data } = useLoader(async () => {
    const res = await hello();
    return res;
  });

  useEffect(() => {
    user();
  }, []);

  const { message = 'bff-express' } = data || {};
  return <div className="hello">{message}</div>;
};

export default App;
